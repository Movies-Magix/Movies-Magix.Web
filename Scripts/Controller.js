ErStr = '';
PageIndex = -1;
FetchParam = '';
GlobTrigger = null;
TempSvURL = 'https://auth.movies-magix.workers.dev/';

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

$(window).trigger('popstate');
setTimeout(() => { StopAnimation(); }, 2000);
$(window).on("scroll", function() { $('header').toggleClass('sticky', window.scrollY > 20); });

$(window).on("popstate", function()
{
	var SecID = -1, LocHsh = location.hash, SecHsh = LocHsh.split('/');
	if (LocHsh.indexOf('/') < 0 || SecHsh.length == 1 || SecHsh[1] == "Home") SecID = 0;
	else if (SecHsh[1] == "Watch")
	{
		if (SecHsh.length == 4)
		{
			FetchParam = "&movCat=" + encodeURIComponent(SecHsh[2])
			+ "&movID=" + encodeURIComponent(SecHsh[3]);
			SecID = 1;
		}
		else SecID = 0;
	}

	if (SecID != PageIndex)
	{
		IsNavReffered = true;
		LoadPage(SecID);
	}
});

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
	$('.body-content .section')
	.removeClass('show');
	setTimeout(() =>
	{
		switch (PCode)
		{
			case 0: default:
				$('#auth-page').css('display', 'grid');	
				$('#auth-page').addClass('show');
				break;

			case 1:
				$('#index-page').css('display', 'flex');	
				$('#index-page').addClass('show');
				break;

			case 2:
				$('#list-page').css('display', 'flex');	
				$('#list-page').addClass('show');
				break;

			case 3:
				$('#watch-page').css('display', 'flex');	
				$('#watch-page').addClass('show');
				break;
		}
	}, 500);
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

function FallbackHandler()
{
	if ($("div.anim-bg").css('opacity') != "0")
	{
		$('div.anim-bg').addClass('paused');
		$('div.anim-bg').addClass('timeout');
		TimerC = 30; IsAutoReloadDisabled = false;

		CDTimer = setInterval(function()
		{
			TimerC--;
			
			if ($("div.anim-bg").css('opacity') == "0") {
				clearInterval(CDTimer);
				return;
			}

			if (IsAutoReloadDisabled)
			{
				clearInterval(CDTimer);
				$('data#refresh-notice').remove();
				$('.anim-bg div.error p a.stopr').remove();
				$('.anim-bg div.error p u.lspace').remove();
				$('.anim-bg .error .rnow').html("Auto reload is disabled!<br>Click here to refresh the page");
				return;
			}

			if (TimerC == 0)
			{
				clearInterval(CDTimer);
				$('.anim-bg div.error a.rnow').text("Reloading the page now....");
				location.reload();
				return;
			}

			$('.anim-bg .error .rnow .countdown').text(TimerC + 's');
		}, 1000);
	}
}

function StartAnimation(DefTxt = 'Loading')
{
	$('.anim-bg .load-text').text(DefTxt);
	setTimeout(function() {
		$("div.anim-bg").css('transform', 'translateY' + '(0%)');
		$("div.anim-bg").removeClass('timeout');
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
		$('div.anim-bg').removeClass('timeout');
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
	fetch(TempSvURL + (IsLogin ? 'Login' : 'Register'), ReqInit)
		.then(async function(AuthRes)
		{
			const JResp = await AuthRes.json();

			if (!JResp.Success)
			{
				StopAnimation();
				DisplayPopup(JResp.Title, JResp.Reason, "Okay", 2);
			}
			else
			{
				
			}
		})
		.catch(function(E)
		{
			console.log(E);
			StopAnimation();
			DisplayPopup("Network Issue", "It looks like your internet connection is unstable, kindly check to make sure that your mobile data is on or you are connected to a Wi-Fi network & then try again",  "Okay", 2);
		});
}

// Ends Auth-Page Functions