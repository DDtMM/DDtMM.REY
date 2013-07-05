using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace DDtMM.REY.Models
{
    public class ModuleInfo
    {
        public string ModuleID { get; set; }
        public Dictionary<string, string> Values { get; set; }
    }
}