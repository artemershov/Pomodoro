"use strict";
// Namespace
var p = {};
// Time settings
p.t = {
	pomodoro:	25,
	longbreak:	15,
	shortbreak:	5,
}
p.t.current = p.t.pomodoro;
// Counters
p.count  = 0;
p.bcount = 1;
p.ifbreak = false;
// Window title
p.title = document.querySelector('title');
p.title.update = function(m,s){
	this.innerHTML = m+':'+s;
}
p.title.reset = function(){
	this.innerHTML = 'Pomodoro';
}
// Clock
p.clock = document.getElementById('clock');
p.clock.update = function(m,s){
	this.querySelector('.minutes').innerHTML = (m.toString().length===1) ? '0'+m : m;
	this.querySelector('.seconds').innerHTML = (s) ? s : '00';
}
p.clock.reset = function(){
	this.querySelector('.minutes').innerHTML = p.t.pomodoro;
	this.querySelector('.seconds').innerHTML = '00';	
}
// Text
p.text = document.getElementById('stat')
p.text.loc = {
	start:	'Click to start',
	stop:	'Click to stop',
	break:	'Take a break',
	exit:	function(count) {return 'You made '+count+' pomodoros today'}
}
p.text.update = function(text,clas){
	this.innerHTML = text;
	this.setAttribute('class',clas);
}
// Order function
p.order = function(){
	if (p.ifbreak && p.bcount===3) {
		p.t.current = p.t.longbreak;
		p.bcount = 0;
	} else if (p.ifbreak) {
		p.t.current = p.t.shortbreak;
	} else {
		p.t.current = p.t.pomodoro;
	}
	p.clock.update(p.t.current);
	if (p.ifbreak) {
		p.text.update(p.text.loc.break,'icon-coffee');
	} else {
		p.text.update(p.text.loc.start,'icon-clock');
	}
}
// Start function
p.start = function(){
	var m = p.t.current, s = 0;	
	p.tick = setInterval(function(){

		if (m===0 && s===0) {p.stop()}
		else if (s===0) {m--;s=59}
		else {s--}

		var min = (m.toString().length===1) ? '0'+m : m,
			sec = (s.toString().length===1) ? '0'+s : s;
		
		p.title.update(min,sec);
		p.clock.update(min,sec);
		
	},1000);
	p.text.update(p.text.loc.stop,'icon-cancel');
	p.text.removeEventListener('click',p.start);
	p.text.addEventListener('click',p.break);
}
// Stop function
p.stop = function(){
	clearInterval(p.tick);
	document.querySelector('audio').play();
	(p.ifbreak) ? p.bcount++ : p.count++;
	p.ifbreak = !p.ifbreak;
	p.title.reset();
	p.order();
	p.text.removeEventListener('click',p.break);
	p.text.addEventListener('click',p.start);
}
// Break function
p.break = function(){
	clearInterval(p.tick);
	p.title.reset();
	p.clock.reset();
	p.ifbreak = false;
	p.text.removeEventListener('click',p.break);
	p.text.addEventListener('click',p.start);
	p.text.update(p.text.loc.exit(p.count),'icon-clock');
}
// Init
p.clock.update(p.t.pomodoro);
p.text.update(p.text.loc.start,'icon-clock');
p.text.addEventListener('click',p.start);

// Prevent text selection
document.body.addEventListener('mousedown',function(e){e.preventDefault()});