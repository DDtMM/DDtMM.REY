using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;

namespace DDtMM.reyRegEx
{
    /// <summary>
    /// Summary description for GetProxy
    /// </summary>
    public class GetProxy : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            string result = "";

            try
            {
                WebRequest request = WebRequest.Create(context.Request["url"]);
                HttpWebResponse response = (HttpWebResponse)request.GetResponse();
                using (StreamReader sr = new StreamReader(response.GetResponseStream()))
                {
                    result = sr.ReadToEnd();
                    sr.Close();
                }
                response.Close();
            }
            catch (Exception ex)
            {
                result = string.Format("<error>{0}</error>", ex.Message);
            }
            context.Response.ContentType = "text/plain";
            context.Response.Write(result);
        }

        public bool IsReusable
        {
            get
            {
                return true;
            }
        }
    }
}