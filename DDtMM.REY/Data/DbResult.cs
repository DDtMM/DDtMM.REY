﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace DDtMM.REY.Data
{
    public enum DbResultStatus { OK, Error, Exception, NotFound }

    public class DbResult<T>
    {
        #region static methods
        /// <summary>
        /// Create a valid result
        /// </summary>
        /// <param name="value"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        public static DbResult<T> ValidResult(T value, string message = null)
        {
            return new DbResult<T>()
            {
                Value = value,
                Status = DbResultStatus.OK,
                Message = message
            };
        }

        /// <summary>
        /// Create a DbResult from an exception
        /// </summary>
        /// <param name="ex"></param>
        /// <returns></returns>
        public static DbResult<T> ExceptionResult(Exception ex)
        {
            return new DbResult<T>()
            {
                Status = DbResultStatus.Exception,
                Message = ex.Message,
                Exception = ex
            };
        }

        /// <summary>
        /// Create a DBResult from a logical error
        /// </summary>
        /// <param name="message"></param>
        /// <param name="status"></param>
        /// <returns></returns>
        public static DbResult<T> ErrorResult(string message, DbResultStatus status = DbResultStatus.Error)
        {
            return new DbResult<T>()
            {
                Status = status,
                Message = message
            };
        }

        #endregion

        #region Properties

        /// <summary>
        /// A returned value from Db operation
        /// </summary>
        public T Value { get; set; }

        /// <summary>
        /// resuls status
        /// </summary>
        public DbResultStatus Status { get; set; }

        /// <summary>
        /// A message, typically populated if an error occurred.
        /// </summary>
        public string Message { get; set; }

        /// <summary>
        /// An exception that caused the db operation to terminate
        /// </summary>
        public Exception Exception { get; set; }

        /// <summary>
        /// Did the operation occur succesfully
        /// </summary>
        public bool IsValid
        {
            get { return Status == DbResultStatus.OK; }
        }

        #endregion

        public DbResult()
        {
            Value = default(T);
            Status = DbResultStatus.OK;
            Message = null;
            Exception = null;
        }
    }
}