//TWITTER POPUP
function twitterPopup(){
    var shareURL = "https://twitter.com/share?";
    var params = {
        url: window.location.href,
	    text: getMeta('twitter:description') + " via @Heritage",
	    hashtags: getMeta('twitter:hashtag')
    }
    for(var prop in params) shareURL += '&' + prop + '=' + encodeURIComponent(params[prop]);

    var w = 550;
    var h = 450;

    var left = (screen.width/2)-(w/2);
    var top = (screen.height/2)-(h/2);

    window.open(shareURL, '', 'left='+left+',top='+top+',width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
}

function getMeta(metaName) {
    const metas = document.getElementsByTagName('meta');
    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === metaName) {
            return metas[i].getAttribute('content');
        }
    }
}

//FACEBOOK POPUP
function facebookPopup(){
    var shareURL = "https://www.facebook.com/sharer/sharer.php?u=" + window.location.href;

    var w = 550;
    var h = 450;

    var left = (screen.width/2)-(w/2);
    var top = (screen.height/2)-(h/2);

    window.open(shareURL, '', 'left='+left+',top='+top+',width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0');
}

//COPY URL
function copyURL(){
    var dummy = document.createElement('input'),
    text = window.location.href;
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
}