using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;
using System.Web.Http;
using System.Web.Routing;
using System.Web.Configuration;
using System.Configuration;
using System.Web.Optimization;
using System.Reflection;
using System.Diagnostics;

namespace DDtMM.REY
{
    public class Global : System.Web.HttpApplication
    {
        public static string Version { get; private set; }

        protected void Application_Start(object sender, EventArgs e)
        {
            // not working on hosting provider
            //EncryptConnString();
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            RouteTable.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{id}",
                defaults: new { id = System.Web.Http.RouteParameter.Optional }
                );

            // this is only for url link in session controller
            RouteTable.Routes.MapHttpRoute(
                name: "SavedSession",
                routeTemplate: "s/{id}",
                defaults: new { id = System.Web.Http.RouteParameter.Optional }
                );

            Assembly assembly = Assembly.GetExecutingAssembly();
            Version = FileVersionInfo.GetVersionInfo(assembly.Location).FileVersion;
        }

        private void EncryptConnString()
        {

            Configuration config = WebConfigurationManager.OpenWebConfiguration(HttpRuntime.AppDomainAppVirtualPath);

            ConfigurationSection section = config.ConnectionStrings;
            if (!section.SectionInformation.IsProtected)
            {
                section.SectionInformation.ProtectSection("RsaProtectedConfigurationProvider");
                config.Save();
            }

        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {

        }
    }
}