// #region Global Declarations

var NavState = 0,
PageIndex = -1,
Settings = {},
SecParam = '',
FirstLoad = true,
IsLogged = false,
VidHandler = null,
PrevHisState = '',
GlobTrigger = null,
PreventLoop = false,
IsNavReffered = false;
const StaticURI = location.origin.replace('://', '://static.') + '/';

// #endregion Global Declarations

// #region Startup

$(document).ready(function()
{
	setTimeout(() =>
	{
		try { AlterTheme(localStorage.getItem('Theme'), false); } catch { };
		$(window).trigger('popstate'); // Initialize
	}, 50);
	
	$('.body-content').on("animationend", '.section', function()
	{
		if ($(this).hasClass('show')) return;
		else $(this).css('display', 'none');
	});

	$('#auth-page').on("transitionend", '.register-frm', function()
	{
		if ($('#auth-page').hasClass('login'))
			$(this).css('display', 'none');
	});
	
	($(window).add('#list-page .movs')).on("scroll", function()
	{
		const MaxSH = Math.max(window.scrollY, $('#list-page .movs')[0].scrollTop);
		$('header').toggleClass('sticky', window.scrollY > 50);
		$('#go-to-top').toggleClass('active', MaxSH > 50);
	});

	$('#go-to-top').on('click', function()
	{
		window.scrollTo({ top: 0, behavior: 'smooth' });
		$('#list-page .movs')[0].scrollTo({ top: 0, behavior: 'smooth' });
	});

	$(window).on('keydown', function(KdE)
	{
		if (KdE.keyCode == 38 || KdE.keyCode == 40)
		{
			if (PageIndex == 2) $('#list-page .movs').focus();
			else if (PageIndex == 3 && VidHandler) VidHandler.OnKeyDown('Focus');
		}
		else if (PageIndex == 3 && KdE.ctrlKey)
		{
			let Handled = false;
			if (KdE.code == 'Space' || KdE.keyCode == 32) { Handled = true; VidHandler.OnKeyDown('Toggle'); }
			else if (KdE.code == 'Period' || KdE.keyCode == 190) { Handled = true; VidHandler.OnKeyDown('Media-F'); }
			else if (KdE.code == 'Comma' || KdE.keyCode == 188) { Handled = true; VidHandler.OnKeyDown('Media-R'); }
			else if (KdE.code == 'Digit0' || KdE.keyCode == 48) { Handled = true; VidHandler.OnKeyDown('Volume-UP'); }
			else if (KdE.code == 'Digit9' || KdE.keyCode == 57) { Handled = true; VidHandler.OnKeyDown('Volume-Down'); }
			if (Handled) KdE.preventDefault();
		}
	});

	$('.sec-bar').on('click', 'span', function (){ $(this).parent().attr('pos', $(this).index()); });
	$('#stick-menu > span').on("click", function() { $('#stick-menu').removeClass('show'); });
});

$(window).on("popstate", async function(PSE)
{
	try
	{
		const FthStatus = await fetch('/auth/Status');
		InitData = await FthStatus.json();
		IsLogged = InitData.IsIn
		&& !InitData.Blocked;
	}
	catch (NErrs)
	{
		InformNETError(NErrs);
		return;
	}

	let Errored = false, SecID = -1,
	LocHsh = location.hash, SecHsh = LocHsh.split('/');
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
		NavState = parseInt(PSE.state);
		IsNavReffered = true; LoadPg(SecID, SecParam);
	}
});

// #endregion Startup

// #region Navigations

function LogoTap()
{
	if (!IsLogged) return;
	if (PageIndex == 1) window.scrollTo({
		top: 0, behavior: 'smooth' });
	else LoadPg(1, null);
}

function Visit(PCode)
{
	if (PageIndex == PCode) { StopAnimation(); return; }
	$('.body-content .section')
	.removeClass('show');
	TextTitle = '';

	setTimeout(() =>
	{
		if (!IsLogged)
		{
			TextTitle = 'Authorization Required || ';
			$('#auth-page').css('display', 'grid');	
			$('#auth-page').addClass('show');
			NavINHistory('Auth');
		}
		else
		{
			if (PCode != 1) $('#stick-menu .home').removeClass('hidden');
			if (PCode != 2) $('#list-page .movs').empty();
			$('#stick-menu .watch').addClass('hidden');
			$('#sm-on-off').removeClass('hide');

			switch (PCode)
			{
				case 1:
					$('#index-page').css('display', 'flex');	
					$('#index-page').addClass('show');
					TextTitle = 'Homepage || ';
					NavINHistory('Home');
					break;

				case 2:
					$('#list-page .movs')[0].scrollTo({ top: 0, behavior: 'smooth' });
					TextTitle = 'Movies in ' + SecParam + ' Category || ';
					$('#list-page').css('display', 'flex');
					$('#list-page').addClass('show');
					NavINHistory('List/' + SecParam);
					break;

				case 3:
					$('#stick-menu .watch').removeClass('hidden');
					var Spt =  SecParam.split('/'); if (Spt.length == 2)
					TextTitle = 'Stream ' + DeSanitize(Spt[1]) + ' Movie || ';
					$('#watch-page').css('display', 'flex');	
					$('#watch-page').addClass('show');
					NavINHistory('Watch/' + SecParam);
					break;
			}
		}

		MapMenuDelay();
		PageIndex = PCode;
		$('#go-to-top').removeClass('active');
		document.title = TextTitle + 'Movies-Magix';
		setTimeout(() => { StopAnimation(); }, 580);
	}, 320);
}

var NavINHistory = (function()
{
	let SPointer = 0;
	const HStack = [];

    return function(Addr)
	{
		if (FirstLoad)
		{
			HStack.push(Addr);
			FirstLoad = false;
			IsNavReffered = false;
			history.replaceState(0,
			Addr + ' Page', "#/" + Addr);
			return;
		}
		else
		{
			if (!IsNavReffered)
			{
				HStack.push(Addr);
				SPointer = HStack.length - 1;
				history.pushState(SPointer, Addr
					+ ' Page', "#/" + Addr);
				return;
			}
			else
			{
				// console.log((SPointer < NavState) ? 'Forward' : 'Backward');
				IsNavReffered = false;
				SPointer = NavState;
			}
		}
    };
})();

async function LoadPg(PId, ResParam = '')
{
	try
	{
		if (!PreventLoop && FirstLoad) InitHomePg(InitData, PId == 1, PId, ResParam);
		else
		{
			let VisitDelay = 500;
			StartAnimation();
			CleanUP();

			switch (PId)
			{
				case 2: // List-Page
					if (!ResParam) PId = 1;
					else if (PopuData = await FetchAndPopulate(ResParam))
					{
						SecParam = ResParam;
						$('#list-page .movs').empty();
						$('#list-page .catg').text(DeSanitize(ResParam));
						PopuData[0].forEach(MovI => BuildMovBox(ResParam, MovI, PopuData[1][MovI]));
					}
					else return;
					break;

				case 3: // Watch-Page
					let Wchs = (ResParam ?? '').split('/'),
					CatgCH = await GetCachedData('/Data/' + Wchs[0]);
					
					if (ResParam && Wchs.length == 2)
					{
						if ((Fetched = await FetchAndPopulate(Wchs[0]))) CatgCH = Fetched[1];

						if (!CatgCH || !CatgCH[Wchs[1]])
						{
							if (CatgCH && !CatgCH[Wchs[1]]) DisplayPopup('Movie Unavailable', 'Movie you just requested doesn\'t exists or is currently not available', 'Okay', 1);
							PId = 1;
						}
						else
						{
							if (!VidHandler) VidHandler = new PlayerHandler();
							VidHandler.InitElements(Wchs[0], Wchs[1], CatgCH[Wchs[1]]);
							VidHandler.InPlayerSetup();
						}
					}
					else PId = 1;
					break;
			}

			setTimeout(() => Visit(PId), VisitDelay);
		}
	}
	catch(Er) { InformNETError(Er) }
}

// #endregion Navigations

// #region Response + Cache-Tool

async function GoodResponse(SvrResp)
{
	let SvOBJ = await SvrResp.json();
	if (SvrResp.ok && SvOBJ.Success) return SvOBJ;
	else
	{
		if (SvOBJ.Display)
		{
			StopAnimation();
			DisplayPopup(SvOBJ.Title, SvOBJ.Message, "Okay", 2);
		}
		if (SvrResp.status == 401) DestroySession();

		return false;
	}
}

async function GetCachedData(CacheUrl)
{
	const CacheStorg = await caches.open('mmx-json-cache');
	const CachedResp = await CacheStorg.match(CacheUrl);
	if (CachedResp && CachedResp.ok)
	return await CachedResp.json();
	else return null;
}

async function FetchAndPopulate(LCateg)
{
	let CchMeta = await GetCachedData('/Meta'), CatgH = 'null',
	CchCatData = await GetCachedData('/Data/' + LCateg);
	if (CchMeta && CchCatData && CchMeta[LCateg])
		CatgH = CchMeta[LCateg];

	var LstResp = await fetch('/api/List',
	{
		headers:
		{
			'X-Category': LCateg,
			'X-Catg-Hash': CatgH
		}
	});

	if (XResp = await GoodResponse(LstResp))
	{
		let HsdObj = CchMeta ?? { },
		StrObj = CchCatData ?? { }, AllKeys = [ ];
		HsdObj[LCateg] = XResp.Hash; await StoreCache(HsdObj, '/Meta');

		if (LstResp.status == 200)
		{
			StrObj = XResp.Data;
			AllKeys = Object.keys(StrObj);
		}
		else
		{
			AllKeys = Object.keys(StrObj);
			let TmpKey = Object.keys(XResp.Data);
			
			for (let I = 0; I < TmpKey.length; I++)
			{
				const MvKey = TmpKey[I];
				StrObj[MvKey]['HasHistory'] = true;
				StrObj[MvKey]['Visit'] = XResp.Data[MvKey].Visit;
				StrObj[MvKey]['Watched'] = XResp.Data[MvKey].Watched;
			}

			for (let J = 0; J < AllKeys.length; J++)
			{
				const UnKey = AllKeys[J];
				if (!TmpKey.includes(UnKey))
					TmpKey.push(UnKey);
			}

			AllKeys = TmpKey;
		}
		
		await StoreCache(StrObj, '/Data/' + LCateg);
		return [ AllKeys, StrObj ];
	}
	else
	{
		if (IsNavReffered && !FirstLoad)
			history.back();
		else Visit(1);
		return false;
	}
}

async function StoreCache(CacheOBJ, CacheLoc)
{
	const CacheStorg = await caches.open('mmx-json-cache');
	await CacheStorg.put(CacheLoc, new Response(JSON.stringify(CacheOBJ), {
		headers: { 'content-type':'application/json' }
	}));
}

// #endregion Response + Cache-Tool

// #region Modals & Popups

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

function InformNETError(ErData)
{
	StopAnimation(); console.error('Error Occured', '\n', ErData);
	if (ErData.name == "SecurityError") DisplayPopup('Permissions Denied', 'Either some permissions is missing or you are in Incognito mode. Please grant required permissions from your browser Settings or try leaving the Private mode.', 'Okay', 2);
	else if (ErData.message.includes('fetch')) DisplayPopup("Network Issue", 'It looks like your internet connection is unstable, please make sure that your mobile data is turned ON or you are connected to a good Wi-Fi network & then try again',  "Okay", 1); else DisplayPopup("Unknown Issue", 'Something went wrong while handling a task. Please ensure that your browser is updated to it\'s latest version. If the issue still persists then consider reporting the error or contact the owner for help.',  "Okay", 2);
}

function ShowModal(MCode)
{
	if (MCode > 2) MCode = 0;
	$('#pop-box > div').removeClass('active');
	$('#pop-box > div').eq(MCode).addClass('active');
	$('#pop-box').addClass('display');
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

// #endregion Modals & Popups

// #region Preloader Triggers

function StartAnimation(LoaderTxt = 'Loading')
{
	setTimeout(function()
	{
		$("div.anim-bg").css('transform', 'translateX' + '(0%)');
		$('.anim-bg .load-text').text(LoaderTxt);
		$("div.anim-bg").removeClass('paused');
		$("div.anim-bg").css('z-index', '500');
		$("div.anim-bg").css('opacity', '1');
		$("body").css('overflow', 'hidden');
	}, 100);
}

function StopAnimation()
{
	$("div.anim-bg").css('opacity', '0');
	$("div.anim-bg").css('transform', 'translateX' + '(-100%)');
	
	setTimeout(function()
	{
		$("div.anim-bg").addClass('paused');
		$("div.anim-bg").css('z-index', '-5');
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (!$('.anim-bg').hasClass('loaded')) $('.anim-bg').addClass('loaded');
		
		setTimeout(() =>
		{
			$("body").css('overflow', 'visible');
			$("body").css('overflow-x', 'hidden');
		}, 500);
	}, 500);
}

// #endregion Preloader Triggers

// #region UI Base Functions

async function ManageRequest(Code)
{
	try
	{
		switch (Code)
		{
			case -1:
				$('#pop-box > div input').val('');
				var SetPnl = $('#pop-box .settings');
				$('#pop-box').removeClass('display');
				$('#pop-box .report .sec-bar').attr('pos', 3);
				SetPnl.find('.theme').attr('pos', Settings.Theme);
				SetPnl.find('.behaviour').attr('pos', Settings.Behaviour);
				break;

			case 0:
				const StPnl = $('#pop-box .settings'), USelThm = parseInt(StPnl.find('.theme').attr('pos')),
				USelBhv = parseInt(StPnl.find('.behaviour').attr('pos')), NPwd = StPnl.find('input').val(),
				HasChanged = NPwd || (USelThm != Settings.Theme) || (USelBhv != Settings.Behaviour);

				if (HasChanged)
				{
					if (NPwd && !(new RegExp(/^(?=.*\d)(?=.*[a-zA-Z]).{8,64}$/)).test(NPwd))
					{
						DisplayPopup("Weak Password", 'Password you are trying to change doesn\'t meet basic security standards! Please make sure that your password is in the range of 8 to 64 characters and contains a combination of numbers & alphabets and then try again!', 'Okay', 1);
						return;
					}

					StartAnimation('Saving');
					let UpdtReq = await fetch('/api/Settings',
					{
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ Pwd: NPwd, Thm: USelThm, Bhv: USelBhv })
					});

					if (XResp = await GoodResponse(UpdtReq))
					{
						Settings.Behaviour = USelBhv;
						Settings.Theme = USelThm;
						AlterTheme(USelThm);
						
						setTimeout(() =>
						{
							ManageRequest(-1); StopAnimation();
							DisplayPopup(XResp.Title, XResp.Message, 'Okay', 0);
						}, 1000);
					}
				}
				else $('#pop-box').removeClass('display');
				break;

			case 1:
				const ErPnl = $('#pop-box .report'), InCode = parseInt(ErPnl.find('.sec-bar').attr('pos')),
				ESub = ErPnl.find('.area input').eq(0).val(), EDescp = ErPnl.find('.area input').eq(1).val();

				if (InCode < 1) return;
				if (!ESub || ESub.length < 5 || ESub.length > 100)
				{
					DisplayPopup('Invalid Subject', 'Subject should be to the point about the error and must lie in the range of 5 to 100 characters in length. Please try again', 'Okay', 1);
					return;
				}

				if (!EDescp || !EDescp.length < 10 || EDescp.length > 1024)
				{
					DisplayPopup('Invalid Description Provided', 'Please describe how and when the error occured in brief but please stay in the range of 10 to 1024 characters while writing the description.', 'Okay', 1);
					return;
				}

				StartAnimation('Reporting');
				const RptReq = await fetch('/api/Error',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ In: InCode, Subject: ESub, Body: EDescp })
				});

				if (await GoodResponse(RptReq))
				{
					StopAnimation(); ManageRequest(-1);
					DisplayPopup('Issue Reported', 'Great Work! You had successfully submitted the bug or error. We\'ll be looking into this issue as soon as possible to fix any potential glitch.', 'Okay', 0);
				}
				break;
		
			case 2:
				const RqPnl = $('#pop-box .request'), MNm = RqPnl.find('.area input').eq(0).val(),
				ILink = RqPnl.find('.area input').eq(1).val(), Extras = RqPnl.find('.area input').eq(2).val();

				if (!MNm || MNm.length < 5 || MNm.length > 100)
				{
					DisplayPopup("Invalid Movie Name", "That not seems like a valid name for a movie, please check to make sure that it is in the range of 5 to 100 characters in length. Please try again!", "Okay", 1);
					return;
				}

				if (!ILink || ILink.length > 50 || !ILink.includes('imdb.com/title/'))
				{
					DisplayPopup("Invalid IMDB Link", "This is not a valid link to IMDB movie title! to get the valid one search on google in format of '<b>Your-Movie-Name IMDB title</b>'; Please note that IMDB title link contains '<b>imdb.com/title/</b>' in it. Please rectify the error and then try again!", "Okay", 1);
					return;
				}

				if (Extras && Extras.length > 256)
				{
					DisplayPopup('Thoughts Too Long', 'Looks like you have huge idea to share but currently we didn\'t support such a large text, please explain your thoughts in less than 256 characters!', 'Okay', 1);
					return;
				}

				StartAnimation('Requesting');
				const ReqReq = await fetch('/api/Movie',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ Name: MNm, IMDB: ILink, Thoughts: Extras })
				});

				if (await GoodResponse(ReqReq))
				{
					StopAnimation(); ManageRequest(-1);
					DisplayPopup('Movie Requested', 'Hurrah! You had successfully requested for a new movie. We will check and add it to our platform as soon as possible.', 'Okay', 0);
				}
				break;
		}
	}
	catch (E) { InformNETError(E); }
}

function BuildCatBox(CatName)
{
	let CatReadable = CatName.replace(/-/g, ' ');
	var CatgBX = $('<div/>', { class: 'cat', onclick: 'LoadPg(2, \'' + CatName + '\');' }),
	CtImg = $('<img/>', { alt: CatName + ' Poster Image', src: 'Images/' + CatName + '_Pic.jpg' }),
	Frthr = $('<div/>', { class: 'further' }); var Frth1 = $('<b/>'), Frth2 = $('<b/>');
	Frth1.text(CatReadable); Frth2.text('Click To Load Movies'); Frthr.append(Frth1, Frth2);
	CatgBX.append(CtImg, Frthr); $('#index-page .wrapper').append(CatgBX);
}

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
		.then(async function(AuthRes) { GoodResponse(AuthRes).then(XRsp => {
			if (XRsp) { InitHomePg(XRsp); $('#auth-page form input').val(''); } } ); }).catch(InformNETError);
}

function BuildMovBox(CurCatg, MovName, MovDetail)
{
	var ResPath = CurCatg + '/' + MovName;
	let MCard = $('<div/>', { class: 'movie-card', onclick: 'LoadPg(3, \'' + ResPath + '\')' });
	var TLImg = $('<img/>', { src: StaticURI + CurCatg.toLowerCase() + '-mmx/' +
	Normalize(MovName) + '.jpg', alt: 'Movie Poster' }), TLTitle = $('<span/>'),
	TLMInf = $('<div/>', { class: 'mv-info' });
	
	var SLLang = $('<b/>', { class: 'lang' }),
	SLRate = $('<b/>', { class: 'age-rate' });

	SLLang.text(MovDetail.Language);
	TLTitle.text(DeSanitize(MovName));
	SLRate.text(MovDetail.Rating.split('+')[0] + '+');
	TLMInf.append(SLLang, SLRate); MCard.append(TLImg);
	if (MovDetail.HasHistory) MCard.append($('<progress/>',
		{ max: 1, value: MovDetail.Watched }));
	MCard.append(TLMInf, TLTitle);
	$('#list-page .movs').append(MCard);
}

function InitHomePg(InitOBJ = null, ToVisit = true, NxtId = -1, EParam = null)
{
	IsLogged = true;
	
	if ($('#index-page .cat').length < 1)
	{
		if (InitOBJ && InitOBJ.Settings && InitOBJ.Categories)
		{
			Settings = InitOBJ.Settings;
			$('.settings .sec-bar.theme').attr('pos', Settings.Theme);
			$('.settings .sec-bar.behaviour').attr('pos', Settings.Behaviour);
			InitOBJ.Categories.forEach(CatElem => { BuildCatBox(CatElem); }); AlterTheme(Settings.Theme);
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
	else { PreventLoop = true; LoadPg(NxtId, EParam); }
}

// #endregion UI Base Functions

// #region Plyr & Watch Functions

function ToggleCastPanel(ICode)
{
	if (VidHandler) VidHandler
		.ToggleCastPanel(ICode);
}

class PlayerHandler
{
	constructor()
	{
		var Exec = false, Tmr = 0, TOutMM = 0, CastPnlActive = false,
		MmxPlayer = null, PInit = 0, IsPsdBefore = true,
		SyncedTM = 0;

		this.InitElements = function(Catg, MNam, MObj)
		{
			let PWch = $('#watch-page .wrapper'), BaseUri = '/media/' + Catg + '/' + MNam;
			PWch.find('h2.mov-title').text(DeSanitize(MNam));
			PWch.find('.video-container').empty();
			SecParam = Catg + '/' + MNam;
			
			const VidCtrl = $('<video/>',
			{
				controls: '',
				class: 'player',
				preload: 'none',
				playsinline: '',
			});

			VidCtrl.attr('data-poster', StaticURI + Catg
			.toLowerCase() + '-mmx/' + Normalize(MNam) + '.jpg');
			if (Settings.Behaviour != 1) VidCtrl.attr('preload', 'metadata');
			VidCtrl.append($('<source/>', { src: BaseUri + '.mp4', type: 'video/mp4' }));
			PWch.find('.video-container').append(VidCtrl);

			var MSz = MObj.Size / 1048576, MSzU = 'MB';
			if (MSz > 999) { MSz = MSz / 1024; MSzU = 'GB'; }
			MSz = Math.trunc(MSz * 100) / 100; // Upto 2 Decimals
			let MDur = Math.trunc((MObj.Duration * 5) / 3) / 100;
			PWch.find('section.descp p').text(MObj['Description']);

			let MvDetE = PWch.find('.infos > div p');
			MvDetE.eq(4).html('<i>Rated For:</i>&nbsp;' + MObj.Rating);
			MvDetE.eq(0).html('<i>Language:</i>&nbsp;' + MObj.Language);
			MvDetE.eq(2).html('<i>Duration:</i>&nbsp;' + MDur + ' Mins');
			MvDetE.eq(3).html('<i>Released On:</i>&nbsp;' + MObj.Released);
			MvDetE.eq(1).html('<i>Video Size:</i>&nbsp;' + MSz + ' ' + MSzU);

			PInit = setInterval(() =>
			{
				if (typeof Plyr == 'undefined') return; else clearInterval(PInit);
				MmxPlayer = new Plyr('#watch-page video.player',
				{
					blankVideo: StaticURI + 'assets-mmx/Blank.mp4',
					keyboard: { focused: false, global: false },
					iconUrl: StaticURI + 'assets-mmx/Plyr.svg',
					storage: { enabled: true, key: "Plyr" },
					listeners:
					{
						fullscreen: function ()
						{
							if (MmxPlayer.fullscreen.active)
							{
								if (IsOnPhone()) screen.orientation.unlock();
								setTimeout(() => { MmxPlayer.fullscreen.exit(); }, 1000);
							}
							else
							{
								MmxPlayer.fullscreen.enter();
								if (IsOnPhone()) setTimeout(() =>
									{
										screen.orientation.lock("landscape")
										.catch(function (_E) { console.warn("Landscape mode is not available!!"); });
									}, 1000);
							}

							return false;
						}
					}
				});

				MmxPlayer.once('loadedmetadata', function()
				{
					if (MObj.HasHistory)
					{
						MmxPlayer.currentTime =	MObj.Watched * MmxPlayer.duration;
						SyncedTM = MmxPlayer.currentTime;
					}

					if (Settings.Behaviour == 3)
					{
						MmxPlayer.muted = true;
						MmxPlayer.play().catch(() => DisplayPopup('Autoplay Disabled', 'Your browser settings or preferences doesn\'t allow autoplay, Please allow this site in your settings or manually start the video.', 'Okay', 2));
						setTimeout(() => { MmxPlayer.muted = false; }, 100);
					}

					Tmr = setInterval(async () =>
					{
						const CurrTime = MmxPlayer.currentTime;
						if (CurrTime > 4 && CurrTime != SyncedTM)
						{
							try
							{
								let LHash = location.hash.split('/'),
								LogRsp = await fetch('/media/Log',
								{
									method: 'POST',
									headers: { 'content-type': 'application/json' },
									body: '{"Name": "' + LHash[LHash.length - 1] + '", "Time": ' + CurrTime + '}'
								});
								
								if (await GoodResponse(LogRsp))
									SyncedTM = CurrTime;
							}
							catch (LEr) { InformNETError(LEr); }
						}
					}, 60000);
				});

				MmxPlayer.on('error', console.log);
				$('#watch-page .plyr__video-wrapper').append(
					$('#watch-page .in-plyr').remove());
				
				 + '/casts-mmx/';
				MObj.Casts.forEach((CastNM) =>
				{
					let CstImg = $('<img/>', { style: "background-image: url('" + StaticURI +
					'casts-mmx/' + Normalize(CastNM) + ".jpg'), url('Images/Img-404.jpg');" }), CstB = $('<b/>'),
					CstTile = $('<div/>', { class: 'cast' }); CstB.text(CastNM); CstTile.append(CstImg, CstB);
					PWch.find('.in-plyr .cast-panel .tiles').append(CstTile);
				});
			}, 100);
		};

		this.InPlayerSetup = function()
		{
			if (Exec) return; else Exec = true;
			let IsPlyrPaused = null, IsSeeking = false,
			Diff = 0, ForwardTimer = 0, BackwardTimer = 0;
			const InPlayer = $('#watch-page .in-plyr')[0];

			$(InPlayer).on('mousemove click', () =>
			{
				if (CastPnlActive) return; clearTimeout(TOutMM);
				const Sender = $('#watch-page .in-plyr'); Sender.addClass('active');
				TOutMM = setTimeout(() => Sender.removeClass('active'), 3000);
			});

			$(InPlayer).on('dblclick click', function(E)
			{
				E.stopPropagation();
				if (CastPnlActive || !MmxPlayer) return;
				if (E.type == 'click' && !IsSeeking) return;
				if (E.type == 'dblclick' && IsSeeking) return;

				const XRel = E.pageX - $(this).offset().left;
				let ClickX = (XRel * 100) / InPlayer.offsetWidth;
				if (ClickX <= 40) SeekAction('backward');
				else if (ClickX >= 60) SeekAction();
				else MmxPlayer.togglePlay();
			});

			function SeekAction(SType = 'forward')
			{
				if (!IsSeeking)
				{
					if (IsPlyrPaused == null)
						IsPlyrPaused = MmxPlayer.paused;
					MmxPlayer.pause();
					IsSeeking = true;
				}

				let IsForward = SType == 'forward';
				const Tapr = $('#watch-page .in-plyr .' + SType);
				clearTimeout(IsForward ? ForwardTimer : BackwardTimer);
				let RwDelta = parseInt(Tapr.find('.txt').text());
				Tapr.addClass('active'); RwDelta += 10;
				Tapr.find('.txt').text(RwDelta + ' S');
				let SeekTimer = setTimeout((IsF) =>
				{
					Diff += (IsForward ? 1 : -1) * RwDelta;
					Tapr.find('.txt').text('0 S');
					Tapr.removeClass('active');
					if (IsF) ForwardTimer = 0;
					else BackwardTimer = 0;

					if (!ForwardTimer && !BackwardTimer)
					{
						IsSeeking = false;
						MmxPlayer.currentTime += Diff;
						if (!IsPlyrPaused)
							MmxPlayer.play();
						IsPlyrPaused = null; Diff = 0;
					}
				}, 1000, IsForward);

				if (IsForward) ForwardTimer = SeekTimer;
				else BackwardTimer = SeekTimer;
			}
		};

		this.ToggleCastPanel = function(ICode)
		{
			if (ICode)
			{
				IsPsdBefore = MmxPlayer.paused;
				MmxPlayer.pause(); CastPnlActive = true;
				$('#watch-page .in-plyr').css('z-index', '10');
				$('#watch-page .in-plyr .cast-panel').addClass('show');
				$('#watch-page .in-plyr .tiles')[0].scrollTo({ top: 0, behavior: 'smooth' });
			}
			else
			{
				$('#watch-page .in-plyr').css('z-index', '4');
				if (!IsPsdBefore && MmxPlayer) MmxPlayer.play();
				setTimeout(() => { CastPnlActive = false; }, 100);
				$('#watch-page .in-plyr .cast-panel').removeClass('show');
			}
		};

		this.OnKeyDown = function(Action)
		{
			if (MmxPlayer)
			{
				if (CastPnlActive && Action != 'Focus') return;
				else
				{
					switch (Action)
					{
						case 'Focus': if (CastPnlActive) $('#watch-page .in-plyr .tiles').focus(); break;
						case 'Volume-Down': MmxPlayer.volume -= 0.1; break;
						case 'Volume-UP': MmxPlayer.volume += 0.1; break;
						case 'Toggle': MmxPlayer.togglePlay(); break;
						case 'Media-F': MmxPlayer.forward(10); break;
						case 'Media-R': MmxPlayer.rewind(10); break;
					}
				}
			}
		};

		this.Dispose = function()
		{
			$('#watch-page .in-plyr .cast-panel')
			.removeClass('show');
			setTimeout(() =>
			{
				$('#watch-page .wrapper').append($('#watch-page .in-plyr').remove());
				$('#watch-page .in-plyr .cast-panel .tiles').empty();
				$('#watch-page .in-plyr').off('mousemove click');
				$('#watch-page .in-plyr').off('dblclick click');
				$('#watch-page .in-plyr').css('z-index', '4');
				clearInterval(Tmr);

				if (MmxPlayer) MmxPlayer.destroy(function ()
					{
						MmxPlayer.pause(); MmxPlayer = null;
						$('#watch-page video source').remove();
						$('#watch-page video.player').get(0).load();
					});
				VidHandler = null;
			}, 300);
		};
	}
};

async function DownloadMov()
{
	try
	{
		const DldFth = await fetch('/media/' + SecParam +
		'.mp4', { headers: { 'X-MType':'Download' } });
		
		if (XResp = await GoodResponse(DldFth))
		{
			$('iframe').attr('src', XResp.URL);
			setTimeout(() => { DisplayPopup('Download Started',
			'Hurrah! the requested movie is being downloaded, Enjoy!', 'Okay', 0) }, 2000);
		}
	}
	catch (DEr) { InformNETError(DEr); }
}

// #endregion Plyr & Watch Functions

// #region Utilities

function CleanUP()
{
	$('#pop-box').removeClass('display');
	$('#stick-menu .home').addClass('hidden');
	if (VidHandler) VidHandler.Dispose();
}

function LogMeOut()
{
	StartAnimation('Removing');
	fetch('/auth/Session', { method: 'DELETE' })
	.then(DestroySession).catch(InformNETError);
}

function IsOnPhone()
{
   try { document.createEvent("TouchEvent"); return true; }
   catch(_NEP) { return false; }
}

function MapMenuDelay()
{
	const ActiveMT = $('#stick-menu > span:not(.hidden)')
	.toArray().reverse(), ActiveMTLength = ActiveMT.length;
	ActiveMT.forEach((Elem, Idx) => { $(Elem).css('--delay',
	((ActiveMTLength - Idx) * 80) + 'ms'); });
}

function DeSanitize(Title)
{
    if (!Title) return '';
	return Title.replace(/\+\+/g, '.')
		.replace(/-/g, ' ')
		.replace(/@@/g, '$')
		.replace(/{{/g, '[')
		.replace(/}}/g, ']')
		.replace(/\~\|\|/g, '/')
		.replace(/\|\|\~/g, '\\');
}

function DestroySession(Evt = null)
{
	StartAnimation();
	IsLogged = false;
	FirstLoad = true; Visit(0);
	$('#list-page .movs').empty();
	$('#sm-on-off').addClass('hide');
	$('#index-page .wrapper').empty();
	$('#pop-box').removeClass('display');
	if (VidHandler) VidHandler.Dispose();
	
	setTimeout(() =>
	{
		StopAnimation(); if (!Evt)
		DisplayPopup("Session Expired", 'Your Authenticated session was expired probably due to another login from other browser. Kindly login again if you want to continue!', 'Okay', 1);
		else DisplayPopup("Logged Out", 'You have been logged out successfully. Have a great day ahead!', "Okay", 0);
	}, 1000);
}

function AlterTheme(ThemeCode, IsSave = true)
{
	if (!ThemeCode) return; else ThemeCode = parseInt(ThemeCode);
	try { IsSave && localStorage.setItem('Theme', ThemeCode); } catch { }

	switch (ThemeCode)
	{
		case 1: $('body').attr('theme', 'killer'); break;
		case 2: $('body').attr('theme', 'blackhole'); break;
		case 3: $('body').attr('theme', 'natural'); break;
	}
}

Normalize = (Name = '') => DeSanitize(Name).replace(/ /g, '-');

// #endregion Utilities
