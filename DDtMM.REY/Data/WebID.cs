using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace DDtMM.REY.Data
{
    public static class WebID
    {
        // valid characters used in constructing ids
        private static readonly List<char> CHARS;

        static WebID()
        {
            CHARS = "abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray().ToList();
        }

        // moves bits around so that the actual value is hidden.
        private static int ObfucateBits(int num)
        {
            bool[] bits = new bool[32];
            int newNum = 0;
            num ^= 1431655765;

            for (int i = 0; i < 32; i++)
            {
                bits[i] = (num & (int)Math.Pow(2, i)) != 0;
            }

            for (int i = 0; i < 15; i += 1)
            {
                bool temp = bits[30 - i];
                bits[30 - i] = bits[i];
                bits[i] = temp;
            }

            for (int i = 0; i < 31; i++)
            {
                if (bits[i]) newNum += 1 << i;
            }

            if (bits[31]) newNum += int.MinValue;
            return newNum;
        }

        // get int value from webId.
        public static int IntFromWebID(string webId)
        {
            int id = 0;
            for (int i = 0; i < 6; i++)
            {
                id += CHARS.IndexOf(webId[5 - i]) * (int)Math.Pow(36, i);

            }

            return ObfucateBits(id);
        }

        // creates a 6 char string web id.
        public static string WebIDFromInt(int id)
        {
            StringBuilder output = new StringBuilder("aaaaaa");
            id = ObfucateBits(id);

            for (int i = 5; i >= 0; i--)
            {
                output[i] = CHARS[id % 36];
                id = id / 36;
            }
            return output.ToString();
        }
    }
}