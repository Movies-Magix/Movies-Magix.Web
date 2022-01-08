ErStr = '';
SecParam = '';
PageIndex = -1;
FirstLoad = true;
IsLogged = false;
PrevHisState = '';
GlobTrigger = null;
PreventLoop = false;
IsNavReffered = false;

$(document).ready(function()
{
	$('.body-content').on("animationend", '.section', function()
	{
		if ($(this).hasClass('show')) return;
		else $(this).css('display', 'none');
	});
	
	$('.sec-bar').on('click', 'span', function (){ $(this).parent().attr('pos', $(this).index()); });
	$('#stick-menu > span').on("click", function() { $('#stick-menu').removeClass('show'); });
});

setTimeout(() => { $(window).trigger('popstate'); }, 1000);
$(window).on("scroll", function() { $('header').toggleClass('sticky', window.scrollY > 20); });

$(window).on("popstate", function()
{
	var InitTxt = $('div#pre-auth').text(), Errored = false;
	SecID = -1, LocHsh = location.hash, SecHsh = LocHsh.split('/');

	if (InitTxt)
	{
		$('div#pre-auth').remove();
		InitData = JSON.parse(InitTxt);
		IsLogged = InitData.IsIn && !InitData.Blocked;
	}

	if (!IsLogged) { Visit(0); FirstLoad = true; return; }
	if (LocHsh.indexOf('/') < 0 || SecHsh.length == 1 || SecHsh[1] == "Home") SecID = 1;
	else if (SecHsh[1] == "List")
	{
		if (SecHsh.length == 3)
		{
			SecParam = SecHsh[2];
			SecID = 2;
		}
		else Errored = true;
	}
	else if (SecHsh[1] == "Watch")
	{
		if (SecHsh.length == 4)
		{
			SecParam = SecHsh[2] + '/' + SecHsh[3];
			SecID = 3;
		}
		else Errored = true;
	}
	else Errored = true;

	if (Errored)
	{
		DisplayPopup('Invalid Location', 'You are trying to visit a non-existing or invalid url. Please double check your entered address and then try again!', 'Okay', 1); SecID = 1;
		
		if (!FirstLoad)
		{
			history.back();
			history.replaceState('', PrevHisState, '#/' + PrevHisState); return;
		}
	}
	else PrevHisState = LocHsh.replace('#/', '');

	if (SecID != PageIndex)
	{
		IsNavReffered = true;
		LoadPg(SecID).then();
		$('#sm-on-off').removeClass('hide');
	}
});

async function LoadPg(PId)
{
	if (!PreventLoop && FirstLoad) InitHomePg(InitData, PId == 1, PId);
	else
	{
		switch (PId)
		{
			case 0:
				//Create Destruct function for Home-Page, List-Page, Watch-Page and invoke it then call Visit
				break;

			case 2: // List-Page
				
				let CchMeta = await GetCachedData('/Meta'),
				ReqCateg = SecParam;
				
				if (CchMeta && CchMeta[ReqCateg])
				{
					//
				}
				break;

			case 3: // Watch-Page
				
				break;
		}

		Visit(PId);
		setTimeout(() => { StopAnimation(); }, 1000);
	}
}

async function GetCachedData(CacheUrl)
{
	const CacheStorg = await caches.open('mmx-json-cache');
	const CachedResp = await CacheStorg.match(CacheUrl);
	if (CachedResp && CachedResp.ok)
	return await CachedResp.json();
	else return false;
}

async function PutCachedData(CacheOBJ, CacheLoc)
{
	const CacheStorg = await caches.open('mmx-json-cache');
	await CacheStorg.put(CacheLoc, new Response(JSON.stringify(CacheOBJ), {
		headers: { 'content-type':'application/json' }
	}));
}

function DisplayPopup(Title, Msg, Btn, Type, OnConf = null)
{
	$('div#popup-msg').removeClass('display');
	var TypeTXT = Type == 0 ? "success" : Type == 1 ? "warning" : "failure";
	if (OnConf != null && typeof OnConf == 'function') GlobTrigger = OnConf;
	$('div#popup-msg').attr('type', TypeTXT);
	$('div#popup-msg .msg-box b').text(Title);
	$('div#popup-msg .msg-box p').html(Msg);
	$('div#popup-msg .msg-box button').text(Btn);

	setTimeout(function() {
		$('div#popup-msg').addClass('display');
		$('div#popup-msg .msg-box button').focus();
	}, 500);
}

function ShowModal(MCode)
{
	if (MCode > 2) MCode = 0;
	$('#pop-box > div').removeClass('active');
	$('#pop-box > div').eq(MCode).addClass('active');
	$('#pop-box').addClass('display');
}

function Visit(PCode)
{
	if (PageIndex == PCode) return;
	$('.body-content .section')
	.removeClass('show');
	TextTitle = '';

	setTimeout(() =>
	{
		switch (PCode)
		{
			case 0: default:
				if (!IsLogged)
				{
					TextTitle = 'Authorization Required || ';
					$('#auth-page').css('display', 'grid');	
					$('#auth-page').addClass('show');
					AddHistory('Auth');
				}
				break;

			case 1:
				$('#index-page').css('display', 'flex');	
				$('#index-page').addClass('show');
				TextTitle = 'Homepage || ';
				AddHistory('Home');
				break;

			case 2:
				TextTitle = 'Movies in ' + SecParam + ' Category || ';
				$('#list-page').css('display', 'flex');	
				$('#list-page').addClass('show');
				AddHistory('List/' + SecParam);
				break;

			case 3:
				var Spt =  SecParam.split('/'); if (Spt.length == 2)
				TextTitle = 'Stream ' + Spt[1] + ' Movie || ';
				$('#watch-page').css('display', 'flex');	
				$('#watch-page').addClass('show');
				AddHistory('Watch/' + SecParam);
				break;
		}

		PageIndex = PCode;
		document.title = TextTitle + 'Movies-Magix';
		setTimeout(() => { StopAnimation(); }, 540);
	}, 260);
}

function HideMe()
{
	$('div#popup-msg').removeClass('display');
	if (GlobTrigger != null && typeof GlobTrigger == 'function')
	{
		GlobTrigger();
		GlobTrigger = null;
	}
};

function LogoTap()
{
	//
}

function AddHistory(Loc)
{
	if (IsNavReffered)
	{
		IsNavReffered = false;
		
		if (FirstLoad)
		{
			FirstLoad = false;
			PrevHisState = Loc;
			history.replaceState('', Loc + ' Page', "#/" + Loc);
		}
	}
	else
	{
		PrevHisState = Loc;
		if (!FirstLoad) history.pushState('', Loc + ' Page', "#/" + Loc);
		else
		{
			FirstLoad = false;
			history.replaceState('', Loc + ' Page', "#/" + Loc);
		}
	}
}

function StartAnimation(DefTxt = 'Loading')
{
	$('.anim-bg .load-text').text(DefTxt);
	setTimeout(function() {
		$("div.anim-bg").css('transform', 'translateY' + '(0%)');
		$("div.anim-bg").removeClass('paused');
		$("div.anim-bg").css('z-index', '500');
		$("div.anim-bg").css('opacity', '1');
		$("body").css('overflow', 'hidden');
		HasScripted = false;
	}, 100);
}

function StopAnimation()
{
	HasScripted = true;
	try { clearTimeout(FbackTOut);
	clearInterval(CDTimer); } catch(e){}
	$("div.anim-bg").css('opacity', '0');
	$("div#css-load-test").css('opacity', '1');
	$("div.anim-bg").css('transform', 'translateX' + '(-100%)');
	
	setTimeout(function()
	{
		$("body").css('overflow', 'visible');
		$("div.anim-bg").css('z-index', '-5');
		$("div.anim-bg").addClass('paused');
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (!$('.anim-bg').hasClass('loaded')) $('.anim-bg').addClass('loaded');
	}, 500);
}

// Start Auth-Page Functions

function HandleSubmission(IsLogin, Evt)
{
	Evt.preventDefault(); let Postable = { };
	const UEm = $(IsLogin ? '#l-email' : '#r-email').val(), UNm = $('#r-name').val(), Acc = $('#r-access').val(), UCfPwd = $('#r-cf-pwd').val(), UPwd = $(IsLogin ? '#l-pwd' : '#r-pwd').val(), RegExEmail = new RegExp(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/), RegExPass = new RegExp(/^(?=.*\d)(?=.*[a-zA-Z]).{8,64}$/);

	if (!RegExEmail.test(UEm))
	{
		DisplayPopup("Invalid Email", "The email address you entered is in invalid format.<br>Kindly re check the field value and rectify the error.", "Okay", 1);
		return;
	}

	if (!IsLogin && !RegExPass.test(UPwd))
	{
		DisplayPopup("Weak Password", "The password you entered doesn't meet security standards.<br>Please ensure that it's length is between 8 to 64 characters and contains a combination of both numbers and alphabets.", "Okay", 1);
		return;
	}
	
	if (IsLogin) Postable = { Email: UEm, Pass: UPwd };
	else
	{
		if (UNm.length > 20 || UNm.length < 4)
		{
			DisplayPopup("Naming Error", "Range of Name field is invalid, Kindlly check to make sure that your name is at least 4 characters long and must not exceed more than 20 characters in total.", "Okay", 1);
			return;
		}
		
		if (UPwd !== UCfPwd)
		{
			DisplayPopup("Password Mismatch", "Confirm password field doesn't match with the Password field, please note that passwords are case sensitive so check for the issue and then try again!", "Okay", 1);
			return;
		}

		Postable = { Name: UNm, Email: UEm, Pass: UPwd, Access: Acc };
	}

	const Canceller = new AbortController(),
	ReqInit = {
		method: 'POST',
		signal: Canceller.signal,
		body: JSON.stringify(Postable),
		headers: { "content-type": "application/json" }
	};

	setTimeout(() => { Canceller.abort(); }, 5000);
	StartAnimation(IsLogin ? 'Verifying' : 'Creating');
	fetch('/auth/' + (IsLogin ? 'Login' : 'Register'), ReqInit)
		.then(async function(AuthRes)
		{
			const JResp = await AuthRes.json();

			if (!JResp.Success)
			{
				StopAnimation();
				DisplayPopup(JResp.Title, JResp.Reason, "Okay", 2);
			}
			else InitHomePg(JResp);
		})
		.catch(function(E)
		{
			StopAnimation();
			DisplayPopup("Network Issue", "It looks like your internet connection is unstable, kindly check to make sure that your mobile data is on or you are connected to a Wi-Fi network & then try again",  "Okay", 2);
		});
}

// Ends Auth-Page Functions

// Start Home-Page Functions

function InitHomePg(InitOBJ = null, ToVisit = true, NxtId = -1)
{
	IsLogged = true;
	
	if ($('#index-page .cat').length < 1)
	{
		if (InitOBJ && InitOBJ.Settings && InitOBJ.Categories)
		{
			$('.settings .sec-bar.behaviour').attr('pos', InitOBJ.Settings.Behaviour);
			$('.settings .sec-bar.theme').attr('pos', InitOBJ.Settings.Theme);
			InitOBJ.Categories.forEach(CatElem => { BuildCatBox(CatElem); });
			
			switch (InitOBJ.Settings.Theme)
			{
				case 1: $('body').attr('theme', 'killer'); break;
				case 2: $('body').attr('theme', 'blackhole'); break;
				case 3: $('body').attr('theme', 'natural'); break;
			}
		}
		else
		{
			StopAnimation();
			DisplayPopup("Unknown Error", "An un-expected error was encountered while trying to handle the server response please try refreshing the page, or contact owner if issue persists!", "Okay", 2);
			return;
		}
	}

	if (ToVisit)
		setTimeout(() =>
		{
			Visit(1);
			setTimeout(() => {
				StopAnimation(); }, 1000);
		}, 100);
	else { PreventLoop = true; LoadPg(NxtId).then(); }
}

function BuildCatBox(CatName)
{
	let CatReadable = CatName.replace(/-/g, ' ');
	var CatgBX = $('<div/>', { class: 'cat', onclick: 'List(\'' + CatName + '\');' }),
	CtImg = $('<img/>', { alt: CatName + ' Poster Image', src: 'Images/' + CatName + '_Pic.jpg' }),
	Frthr = $('<div/>', { class: 'further' }); var Frth1 = $('<b/>'), Frth2 = $('<b/>');
	Frth1.text(CatReadable); Frth2.text('Click To Load Movies'); Frthr.append(Frth1, Frth2);
	CatgBX.append(CtImg, Frthr); $('#index-page .wrapper').append(CatgBX);
}

// Ends Home-Page Functions
