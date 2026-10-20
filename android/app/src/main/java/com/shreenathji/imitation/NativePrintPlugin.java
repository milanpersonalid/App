package com.shreenathji.imitation;

import android.content.Context;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.graphics.Color;
import android.view.Window;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {
    @PluginMethod
    public void setSystemBars(PluginCall call) {
        boolean bright = call.getBoolean("bright", false);
        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            int barColor = bright ? Color.rgb(244, 244, 246) : Color.rgb(30, 30, 36);
            window.setStatusBarColor(barColor);
            window.setNavigationBarColor(barColor);
            WindowCompat.getInsetsController(window, window.getDecorView())
                .setAppearanceLightStatusBars(bright);
            WindowCompat.getInsetsController(window, window.getDecorView())
                .setAppearanceLightNavigationBars(bright);
            call.resolve();
        });
    }

    @PluginMethod
    public void print(PluginCall call) {
        String jobName = call.getString("jobName", "Stage Slip");
        getActivity().runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                PrintManager printManager = (PrintManager) getActivity()
                    .getSystemService(Context.PRINT_SERVICE);
                if (printManager == null || webView == null) {
                    call.reject("Android print service is unavailable.");
                    return;
                }

                PrintAttributes attributes = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setColorMode(PrintAttributes.COLOR_MODE_COLOR)
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .build();
                printManager.print(
                    jobName,
                    webView.createPrintDocumentAdapter(jobName),
                    attributes
                );

                JSObject result = new JSObject();
                result.put("started", true);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("Could not open Android print options.", error);
            }
        });
    }

    @PluginMethod
    public void saveCsv(PluginCall call) {
        String filename = call.getString("filename", "ledger.csv");
        String csv = call.getString("csv", "");
        Uri uri = null;
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                call.reject("Saving directly to Downloads requires Android 10 or newer.");
                return;
            }

            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
            values.put(MediaStore.Downloads.MIME_TYPE, "text/csv");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            values.put(MediaStore.Downloads.IS_PENDING, 1);

            uri = getActivity().getContentResolver().insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            );
            if (uri == null) {
                call.reject("Android could not create the CSV file in Downloads.");
                return;
            }

            try (OutputStream output = getActivity().getContentResolver().openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("Could not open the CSV file.");
                output.write(csv.getBytes(StandardCharsets.UTF_8));
            }

            ContentValues completed = new ContentValues();
            completed.put(MediaStore.Downloads.IS_PENDING, 0);
            getActivity().getContentResolver().update(uri, completed, null, null);

            JSObject result = new JSObject();
            result.put("saved", true);
            result.put("location", "Downloads/" + filename);
            call.resolve(result);
        } catch (Exception error) {
            if (uri != null) {
                try {
                    getActivity().getContentResolver().delete(uri, null, null);
                } catch (Exception ignored) {
                    // Keep the original save error for the JavaScript caller.
                }
            }
            call.reject("Could not save the CSV to Downloads.", error);
        }
    }

}
