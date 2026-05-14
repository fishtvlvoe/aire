using Newtonsoft.Json;
using System;
using System.IO;
using System.Net;
using System.Text;
namespace APIExample
{
    public class ApiHelper
	{
        //API安全碼
        static string _ClientID = "使用者的_ClientID"; //[※ 1 ※]請輸入使用者的 Client ID
        static string _SecretCode = "使用者的_SecretCode"; //[※ 2 ※]請輸入使用者的 Secret Code 

        static string _getTokenUrl = "https://copapi.moi.gov.tw/cp/getToken";

        //依據「MOI_API_001地籍土地標示部資料服務」在協作平台上定義的API服務網址
        static string _url = "https://copapi.moi.gov.tw/sandbox/api/LandDescription/1.0"; //[※ 5 ※] 服務網址

        static string _Token = "";
        private static void RequestToken()
        {
            Uri _uri = new Uri(_getTokenUrl);

            HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(_uri);

            //將應用系統識別碼 及 密碼 用 「：」連接起來成為一個字串
            string _credString = string.Format("{0}:{1}", _ClientID, _SecretCode);

            //將該字串轉為二進位資料
            Byte[] _credByte = Encoding.ASCII.GetBytes(_credString);

            //將前述的二進位資料轉換為 base64 字串格式
            string _credBase64 = Convert.ToBase64String(_credByte);

            //將前述的字串放進 http header
            request.Headers.Add("Authorization", "Basic " + _credBase64);

            //設定 contentType 為 json
            request.ContentType = "application/json; charset=utf-8";

            //設定使用 post 方式發送要求
            request.Method = "GET";

            var httpResponse = (HttpWebResponse)request.GetResponse();
            string _result = "";
            //取出回傳的資料內容
            using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
            {
                _result = streamReader.ReadToEnd();
            }

            getTokenResponseObject resObj = JsonConvert.DeserializeObject<getTokenResponseObject>(_result);

            _Token = resObj.access_token;

        }

        private static HttpWebRequest CreateRequest(string url)
		{
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            Uri _uri = new Uri(url);

			HttpWebRequest request = (HttpWebRequest)HttpWebRequest.Create(_uri);

            if(_Token == "" || IsExpired(_Token))
            {
                RequestToken();
            }


			//將應用系統識別碼 及 密碼 用 「：」連接起來成為一個字串
			string _credString = string.Format("{0}", _Token);

			//將前述的字串放進 http header
			request.Headers.Add("Authorization", "Bearer " + _credString);

			//設定 contenttype 為 json
			request.ContentType = "application/json; charset=utf-8";

			//設定使用 post 方式發送要求
			request.Method = "POST";

			return request;
		}

        /// <summary>
        /// 呼叫API服務
        /// </summary>
        /// <param name="method">功能介面名稱</param>
        /// <param name="json">服務參數</param>
        /// <returns></returns>
		public static string Request(string method, string json)
		{
			string _result;

			//建立指定方法的 httprequest 物件
			HttpWebRequest request = CreateRequest(_url  + "/" + method);

			//將json資料寫進 httprequest的body中
			using (var streamWriter = new StreamWriter(request.GetRequestStream()))
			{
				streamWriter.Write(json);
				streamWriter.Flush();
			}

			//取得API執行的結果
			var httpResponse = (HttpWebResponse)request.GetResponse();

			//取出回傳的資料內容
			using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
			{
				_result = streamReader.ReadToEnd();
			}

			return _result;

		}

        public class JwtPayload
        {
            public string exp { get; set; }
        }

        private static bool IsExpired(string jwtToken)
        {
            string[] parts = jwtToken.Split('.');
            byte[] payloadBytes = Decode(parts[1]);
            string json = System.Text.Encoding.UTF8.GetString(payloadBytes);
            JwtPayload obj = JsonConvert.DeserializeObject<JwtPayload>(json);
            DateTime dt = DateTime.Parse(obj.exp);
            return DateTime.Now > dt;

            byte[] Decode(string input)
            {
                var output = input;
                output = output.Replace('-', '+');
                output = output.Replace('_', '/');
                switch (output.Length % 4)
                {
                    case 0: break;
                    case 2: output += "=="; break;
                    case 3: output += "="; break;
                    default: throw new System.ArgumentOutOfRangeException("input", "Illegal base64url string!");
                }
                var converted = Convert.FromBase64String(output);
                return converted;
            }
        }

    }
}