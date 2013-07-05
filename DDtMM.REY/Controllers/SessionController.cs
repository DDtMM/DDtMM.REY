using DDtMM.REY.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace DDtMM.REY
{
    public class SessionController : ApiController
    {
        // GET api/<controller>
        //public IEnumerable<string> Get()
        //{
        //    return new string[] { "value1", "value2" };
        //}

        // GET api/<controller>/5
        public HttpResponseMessage Get(string id)
        {
            return Request.CreateResponse(HttpStatusCode.OK, id);
        }

        // POST api/<controller>
        public void Post([FromBody]SessionInfo value)
        {
            string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
            int charsMaxIndex = chars.Length - 1;
            int fileLength = 10;
            Random rnd = new Random();

            string fileName = "";
            for (int i = 0; i < fileLength; i++)
            {
                fileName += chars[rnd.Next(charsMaxIndex)];
            }

            value.SerializeObject<SessionInfo>(String.Format("~/app_Data/{0}.xml", fileName));

        }

        // PUT api/<controller>/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/<controller>/5
        public void Delete(int id)
        {
        }
    }
}