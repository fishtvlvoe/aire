<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="APIExample._Default" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
        注意：<br />1. 請先修改 ApiHelper.cs 內 _ClientID 以及 _SecretCode <br />
        2. 修改Default.aspx.cs內功能介面名稱及服務參數<br />
        3. ApiHelper.cs 預設呼叫MOI_API_001地籍土地標示部資料服務，請修改_url的參數內容。
        <br />
        <asp:Button ID="Button2" runat="server" Text="MOI_API_001地籍土地標示部資料服務" onclick="Button2_Click" />
		<br />
		<asp:TextBox ID="TextBox1" runat="server" Height="462px" TextMode="MultiLine" 
			Width="510px"></asp:TextBox>
    


    </div>
    </form>
</body>
</html>
