window.onscroll = function() {scrollTop()};

function scrollTop() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("btnScrollTop").style.display = "block";
    } else {
        document.getElementById("btnScrollTop").style.display = "none";
    }
}