package com.shreenathji.imitation;

import android.content.Context;
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
}
