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

namespace DDtMM.REY
{
    public class Global : System.Web.HttpApplication
    {

        protected void Application_Start(object sender, EventArgs e)
        {
            // not working on hosting provider
            //EncryptConnString();

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