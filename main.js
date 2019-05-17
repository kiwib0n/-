var ptr = new Vue({
	el: '#main',
	
	data(){
		return {
			message: 'Hello',
			actualDate :'',
			infoXML:[],
			infoJSON: [],
			totalPage:0,
			currentPage:1,
			perPage: 5,
			dataCurrentPage:[],
			
			
			currentValute: "1",
			currentRub:"1",
			active: null,
			
			request: null,
			execption: false,
			descriptionError: '',
			convertState: false,
		};
	},
	
	watch:{
		currentPage:function(){
			this.dataCurrentPage = this.infoJSON[this.currentPage-1];
			if(this.active >= this.perPage)
				this.active = this.active - this.perPage;
		},
		active:function(){
			if(this.active >= this.perPage)
				this.active = this.active - this.perPage;
			this.currentRub = this.dataCurrentPage[this.active]['Value'];
			this.currentValute = this.dataCurrentPage[this.active]['Nominal'];
		},
		currentValute:function(){
			var side = '';
			for(var i=0;i<(this.currentValute).length;i++){
				var chr = this.currentValute[i];
				side += ( '0'<=chr && chr<='9') ? chr : ( (chr == ',' || chr == '.') ? chr : '');
			}
			this.currentValute = side;
			this.currentValute = this.currentValute.replace(',','.');
			this.currentRub = (this.currentValute*this.dataCurrentPage[this.active]['Value']).toFixed(3); 
		}
	},
	
	beforeMount:function(){
		console.log("Готовлю настройки для отправки запроса...");
		this.request = true;
		var date = new Date();
		var request_date_format = date.getDate()+'/';
		if(date.getMonth()<10)
			request_date_format += "0"+date.getMonth()+'/';
		request_date_format += date.getFullYear()
		
		var unblockURL = "https://cors-anywhere.herokuapp.com/";
		var IncorrectUrl = '2'+"http://www.cbr.ru/scripts/XML_daily.asp?date_req=";
		var CorrectUrl = "http://www.cbr.ru/scripts/XML_daily.asp?date_req=";
		
		var url = unblockURL;
		
			//для проверки на ошибки выполнении запроса
		//url += IncorrectUrl;
			//обычный (рабочий) URL
		url += CorrectUrl;
		
		var headers = {
		  'Access-Control-Allow-Origin': '*',
		  'Content-Type': 'application/json',
		};
		axios.get( (url+request_date_format), headers )
			.then(response=>{
				console.log("Запрос пришел нормально...");
				this.infoXML = response.data;
				this.infoJSON = this.XmlToJson(this.infoXML);
				this.infoJSON = _.chunk(this.infoJSON, this.perPage);
				this.totalPage = (this.infoJSON).length;
				this.dataCurrentPage = this.infoJSON[this.currentPage - 1];
				this.request = false;
				
			console.log("Всего страниц: "+this.totalPage);
				
			})
			.catch(error=>{
				console.log("при выполнении запроса возникла ошибка...");
				this.descriptionError = error;
				this.execption = true;
			})
	},
	
	methods:{
		XmlToJson:function(xml){
			console.log("Начинаю парсить XML..");
			this.convertState = true;
			var DATA = [];
			xml = (xml.split("</Valute>"))
			
			for(var i=0;i<xml.length;i++){
				if(i==0){
						//получаем дату, на которую актуален данный курс валют
					for(var j=xml[i].indexOf('Date="')+6;j<xml[i].indexOf('" name');j++){
						this.actualDate += xml[i][j];
					}
					continue;
				}
					//получаем ID валюты
				var ID = "";
				for(var j=xml[i].indexOf('Valute ID="')+11;j<xml[i].indexOf('<NumCode')-2;j++)
					ID += xml[i][j];
					//получаем NumCode валюты
				var NumCode = "";
				for(var j=xml[i].indexOf('<NumCode>')+9;j<xml[i].indexOf('</NumCode>');j++)
					NumCode += xml[i][j];
					//получаем CharCode валюты
				var CharCode = "";
				for(var j=xml[i].indexOf('<CharCode>')+10;j<xml[i].indexOf('</CharCode>');j++)
					CharCode += xml[i][j];
					//получаем Nominal валюты
				var Nominal = "";
				for(var j=xml[i].indexOf('<Nominal>')+9;j<xml[i].indexOf('</Nominal>');j++)
					Nominal += xml[i][j];
				Nominal = Nominal.replace(',','.');
					//получаем Name валюты
				var Name = "";
				for(var j=xml[i].indexOf('<Name>')+6;j<xml[i].indexOf('</Name>');j++)
					Name += xml[i][j];
					//получаем Value валюты
				var Value = "";
				for(var j=xml[i].indexOf('<Value>')+7;j<xml[i].indexOf('</Value>');j++)
					Value += xml[i][j];	
				Value = Value.replace(',','.');
				
				if( (Nominal == "") && (Value == "") && (CharCode == "") && (ID == "") && (NumCode == "") && (Name == "") )
						continue;
				
				DATA.push({
					'ID':ID,
					'NumCode': NumCode,
					'CharCode':CharCode,
					'Nominal':Nominal,
					'Name':Name,
					'Value':Value
				});
			}
			console.log("Закончил парсить XML...");
			return DATA;
		},
		
		convert:function(value){
			this.currentRub = this.currentValute*value;
		}
		
	},
});