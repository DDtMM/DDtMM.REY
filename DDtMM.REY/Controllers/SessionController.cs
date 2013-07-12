using DDtMM.REY.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using System.Web.Http.Routing;
using System.Web.Routing;

namespace DDtMM.REY
{
    public class SessionController : ApiController
    {
        private static readonly string appDataPathTemplate = 
            HostingEnvironment.MapPath("~/App_Data/") + "{0}.xml";
        
        public HttpResponseMessage Get(string id)
        {
            SessionInfo session = null;

            try
            {
                session = SerializableIO.DeSerializeObject<SessionInfo>(String.Format(appDataPathTemplate, id));
            }
            catch (FileNotFoundException ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.NotFound, String.Format("{0} not found.", ex));
            }
            catch (Exception ex)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
            }

            return Request.CreateResponse(HttpStatusCode.OK, session);
        }

        // POST api/<controller>
        public HttpResponseMessage Post([FromBody]SessionInfo value)
        {
            string fileName;
            Console.WriteLine(value);
            try {
                string chars = "abcdefghijklmnopqrstuvwxyz1234567890";
                int charsMaxIndex = chars.Length - 1;
                int fileLength = 8;
                Random rnd = new Random();
   
                do {
                    fileName = "";
                    for (int i = 0; i < fileLength; i++)
                    {
                        fileName += chars[rnd.Next(charsMaxIndex)];
                    }
                }
                while (File.Exists(String.Format(appDataPathTemplate, fileName)));

                value.SerializeObject<SessionInfo>(String.Format(appDataPathTemplate, fileName));
            } 
            catch (Exception ex) 
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, ex);
            }

            var message = Request.CreateResponse(HttpStatusCode.Created);
            var uri = Url.Link("SavedSession", new { id = fileName });

            message.Headers.Location = new Uri(uri);
            return message;
        }

        //// PUT api/<controller>/5
        //public void Put(int id, [FromBody]string value)
        //{
        //}

        //// DELETE api/<controller>/5
        //public void Delete(int id)
        //{
        //}
    }
}