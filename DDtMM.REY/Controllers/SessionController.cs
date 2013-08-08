using DDtMM.REY.Data;
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

        public HttpResponseMessage Get(string id)
        {
            ReyDb db = new ReyDb();
            DbResult<SessionInfo> result = db.GetSession(id);
            HttpResponseMessage message;

            if (result.IsValid)
            {
                message = Request.CreateResponse(HttpStatusCode.OK, result.Value);
            }
            else
            {
                message = message = ResponseFromError(result);
            }

            return message;
        }

        public HttpResponseMessage Post([FromBody]SessionInfo value)
        {
            ReyDb db = new ReyDb();
            DbResult<SessionInfo> result = db.SaveSession(value);
            HttpResponseMessage message;

            if (result.Status == DbResultStatus.OK)
            {
                message = Request.CreateResponse(HttpStatusCode.Created);
                var uri = Url.Link("SavedSession", new { id = value.ID });
                message.Headers.Add("rey_sessionid", value.ID);
                message.Headers.Location = new Uri(uri);
            }
            else
            {
                message = ResponseFromError(result);
            }
            
            return message;
        }

        /// <summary>
        /// Creates an http error response from an error db Result
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="errorResult"></param>
        /// <returns></returns>
        private HttpResponseMessage ResponseFromError<T>(DbResult<T> errorResult)
        {
            if (errorResult.Exception != null)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, errorResult.Message,
                    errorResult.Exception);
            }

            return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, errorResult.Message);
        }
    }
}