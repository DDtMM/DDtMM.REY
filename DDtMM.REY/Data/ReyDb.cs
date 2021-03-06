﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Web.Configuration;
using MongoDB.Driver.Builders;
using System.Text;
using DDtMM.REY.Models;
using MongoDB.Bson.Serialization;
using System.Text.RegularExpressions;

namespace DDtMM.REY.Data
{
    public class ReyDb
    {

        private MongoDatabase _db = null;
 
        private MongoDatabase Connect(bool forceConnect = false)
        {
            if (_db == null || forceConnect)
            {
                var conn = WebConfigurationManager.ConnectionStrings["rey"].ConnectionString;
                // get the database we are connecting to
                var dbName = Regex.Match(conn, @"(?<=//[^/]+/).+").Value;
                return _db = new MongoClient(conn).GetServer().GetDatabase(dbName);
            }
            return _db;
        }


        private int GeNextSequenceID(string collection) 
        {
            MongoDatabase db = Connect();
            MongoCollection sequenceid = db.GetCollection("sequenceid");
            
            FindAndModifyResult result = sequenceid.FindAndModify(
                Query.EQ("_id", collection),
                SortBy.Null,
                Update.Inc("nextid", 1));

            if (result.Ok && result.ModifiedDocument != null)
            {
                return result.ModifiedDocument["nextid"].AsInt32;
            }

            return -1;

        }

        public DbResult<SessionInfo> SaveSession(SessionInfo session)
        {
            MongoDatabase db = Connect();
            try
            {
                if (String.IsNullOrEmpty(session.ID))
                {
                    session.ID = WebID.WebIDFromInt(GeNextSequenceID("session"));
                }
            
                session.Updated = DateTime.Now;
                var result = db.GetCollection("session").Save(session);
                if (result.Ok) return DbResult<SessionInfo>.ValidResult(session);
                return DbResult<SessionInfo>.ErrorResult(result.ErrorMessage);
            }
            catch (Exception ex)
            {
                return DbResult<SessionInfo>.ExceptionResult(ex);
            }
        }

        public DbResult<SessionInfo> GetSession(string id)
        {
            MongoDatabase db = Connect();
            try
            {
                FindAndModifyResult result = db.GetCollection<SessionInfo>("session").FindAndModify(
                    Query.EQ("_id", id),
                    SortBy.Null,
                    Update.Set("Accessed", BsonDateTime.Create(DateTime.Now)));

                SessionInfo session = null;

                if (result.Ok && result.ModifiedDocument != null)
                {
                    session = (SessionInfo) result.GetModifiedDocumentAs(typeof(SessionInfo));
                }

                if (session != null) return DbResult<SessionInfo>.ValidResult(session);
                return DbResult<SessionInfo>.ErrorResult(
                    String.Format("{0} Not Found", id), DbResultStatus.NotFound);
            }
            catch (Exception ex)
            {
                return DbResult<SessionInfo>.ExceptionResult(ex);
            }
        }
    }


}