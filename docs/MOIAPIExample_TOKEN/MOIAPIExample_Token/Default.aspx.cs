using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace APIExample
{
	public partial class _Default : System.Web.UI.Page
	{
		protected void Page_Load(object sender, EventArgs e)
		{

		}

		protected void Button2_Click(object sender, EventArgs e)
        {
            //依據「MOI_API_001地籍土地標示部資料服務」在協作平台上定義的傳入參數JSON結構
            //產生動態物件，並包含 unit, sec, no等屬性
            var obj = new List<object>();
            obj.Add(new { unit = "BA", sec = "0001", no = "00020000"}); //[※ 3 ※]可修改此處之呼叫參數

            //將物件序列化為 json 文字
            var json = JsonConvert.SerializeObject(obj);

            //依據「MOI_API_001地籍土地標示部資料服務」在協作平台上定義的介面名稱進行調整
            //執行服務呼叫
            //代入功能介面名稱、JSON參數內容
            var response = ApiHelper.Request("QueryByLandNo", json);  //[※ 4 ※] 可修改此處之功能介面名稱

            TextBox1.Text = response;
        }

    }
}