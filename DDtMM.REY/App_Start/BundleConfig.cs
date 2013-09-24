using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace DDtMM.REY
{
    public class BundleConfig
    {
        public static void RegisterBundles(BundleCollection bundles)
        {


            bundles.Add(new ScriptBundle("~/Scripts/bundle").Include(
                    "~/Scripts/jquery-{version}.js",
                    "~/Scripts/jquery-ui-{version}.custom.js",
                    "~/Scripts/xregexp/xregexp*",
                    "~/Scripts/xregexp/addons/unicode/unicode-*",
                    "~/Scripts/dg*",
                    "~/Scripts/reymodules/*.js",
                    "~/Scripts/rey*"
                ));

            // end in ace for code to work correctly.
            bundles.Add(new ScriptBundle("~/Scripts/ace/bundle").Include(
                    "~/Scripts/ace/ace.js"

                ));

            bundles.Add(new StyleBundle("~/Content/bundle").Include(
                    "~/Content/ReyRegEx.css"
                    
                ));
            bundles.Add(new StyleBundle("~/Content/jquery-ui-theme/bundle").Include(
                    "~/Content/jquery-ui-theme/jquery-ui-1.10.2.custom.css"
                ));

        }
    }
}