using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace DDtMM.REY.Models
{
    public class SessionInfo
    {
        [BsonId]
        public string ID { get; set; } 
        public string Regex { get; set; }
        public string Modifiers { get; set; }
        public string Target { get; set; }
        public string ActiveModuleID { get; set; }
        public List<ModuleSetting> ModuleSettings { get; set; }

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Accessed { get; set; }

        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime Updated { get; set; }

        public SessionInfo()
        {
            ModuleSettings = new List<ModuleSetting>();
        }
    }
}