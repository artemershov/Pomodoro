// Param  ========================================================
	var I;
	var locale = {
		start	:	'Start pomodoro',
		break	:	'Start break timer',
		stop	:	'Click to stop',
		close	:	'Click to close',
		runPm	:	'Pomodoro is running',
		runBr	:	'Break timer is running',
		stopped	:	'Timer has stopped',
		minimum	:	'Must be greater that 0',
		maximum	:	'Must be less than 1000',
	};
	var defaultParam = {
		time : {
			// Time in minutes
			pomodoro   : 25,
			longbreak  : 15,
			shortbreak : 5,
		},
		gui : {
			type   : 'canvas', // canvas or html
			color  : 'color03', // class in style.css
			audio  : true, // audio notification
			notify : false // browser notification
		}
	}
	var param = (Cookies.getJSON('Pomodoro_param')) ? Cookies.getJSON('Pomodoro_param') : defaultParam;

// Pomodoro timer ================================================
	function pomodoroTimer(timerCb,startCb,stopCb,resetCb) {
		var P = this, timer;

		// Status object
		this.status = {
			'current' : param.time.pomodoro,
			'countPm' : 0,
			'countBr' : 0,
			'isBreak' : false,
			'isTimer' : false
		}
		
		// Pomodoro or break order
		var order = function(){
			if (P.status.isBreak && P.status.countBr == 2) {
				P.status.current = param.time.longbreak;
				P.status.countBr = 0;
			} else if (P.status.isBreak) {
				P.status.current = param.time.shortbreak;
			} else {
				P.status.current = param.time.pomodoro;
			}
		}
		
		// Start timer
		this.start = function(){
			P.status.isTimer = true;
			var timeStart = new Date();
			var timeStop  = new Date(timeStart);
			timeStop.setMinutes(timeStop.getMinutes() + P.status.current);
			timer = setInterval(function(){
				if (timeStop - timeStart) {
					timeStart.setSeconds(timeStart.getSeconds() + 1);
				} else {
					P.stop();
				}
				var rest = new Date(timeStop - timeStart);
				var min = rest.getUTCHours() * 60 + rest.getMinutes();
				var sec = rest.getSeconds();
				if (timerCb) {
					timerCb(min,sec);
				}
				// console.log(min + ' : ' + sec);
			},1000);
			if (startCb) {
				startCb();
			}
		}
		
		// Stop timer
		this.stop = function(){
			if (timer) {
				clearInterval(timer);
				P.status.isTimer = false;
				(P.status.isBreak) ? P.status.countBr++ : P.status.countPm++;		
				P.status.isBreak = !P.status.isBreak;
				order();
				if (stopCb) {
					stopCb();
				}
				// console.log('Pomodoro: ' + P.status.countPm);
			} else {
				// console.log('Start timer first');
			}
		}
		
		// Break timer
		this.reset = function(){
			clearInterval(timer);
			order();
			P.status.isTimer = false;
			P.status.isBreak = false;
			P.status.countBr = 0;
			if (resetCb) {
				resetCb();
			}
			// console.log('Pomodoro: ' + P.status.countPm);
		}
	}

// Pomodoro interface ============================================
	function pomodoroInterface() {
		var P = new pomodoroTimer(clockUpdate,startCb,stopCb,resetCb);
		this.status = P.status;
		this.start  = P.start;
		this.stop   = P.stop;
		this.reset  = P.reset;

		var	clockStat	=	$('.clock-stat .count'),
			clockBtn	=	$('.clock-btn'),
			clockMin	=	$('.minutes'),
			clockSec	=	$('.seconds'),
			title		=	$('title'),
			audio		=	$('audio');

		// Canvas code
			
			// Canvas param
			var clock = {
				size		:	48,
				lineWidth	:	0.2,
				timeSize	:	24,
				color		:	'#FFF'
			}
			
			// Canvas init
			var stage = new createjs.Stage("canvas");
			var container = new createjs.Container();
			stage.addChild(container);
			var circleA = new createjs.Shape();
			circleA.graphics.s(clock.color).ss(clock.lineWidth).dc(0, 0, clock.size);
			circleA.alpha = 0.2;
			var circleB = circleA.clone(true);
			var circleC = circleA.clone(true);
			var clockGraph = new createjs.Shape();
			clockGraph.graphics.s(clock.color).ss(clock.lineWidth*2).a(0, 0, clock.size-2, 0, 360*Math.PI/180);
			clockGraph.rotation = -90;
			var clockTime = new createjs.Text(P.status.current + ":00", "100 " + clock.timeSize + "px Roboto, Trebuchet MS, sans-serif", clock.color);
			clockTime.textAlign = 'center';
			clockTime.textBaseline = 'middle';
			clockTime.y = -1;
			clockTime.shadow = clockGraph.shadow = circleA.shadow = circleB.shadow = circleC.shadow = new createjs.Shadow("rgba(0,0,0,0.2)",1,1,10);
			container.addChild(clockTime,clockGraph,circleA,circleB,circleC);
			stage.update();
			
			// Render canvas clock
			function drawClock(min,sec,text) {
				var status = 100 / (P.status.current * 60) * (parseInt(min) * 60 + parseInt(sec));
				var percent = status * 3.6 * (Math.PI / 180);
				clockGraph.graphics.clear().s(clock.color).ss(clock.lineWidth*2).a(0, 0, clock.size-2, 0, percent);
				clockTime.text = min + ':' + sec;
				stage.update();
			}
			
			// Animation of circle
			var t=0,m=0;
			createjs.Ticker.setFPS(30);
			createjs.Ticker.addEventListener("tick", onTick);
			createjs.Ticker.setPaused(true);
			function onTick() {
				if (!createjs.Ticker.getPaused()) {
					var Ax = Math.sin(t) * 10 * m,
						Ay = Bx = Math.cos(t) * 10 * m,
						By = (Math.cos(t) - Math.sin(t)) * 10 * m,
						Cx = Math.sin(t) * 5 * m,
						Cy = (Math.sin(t) - Math.cos(t)) * 5 * m;
					circleA.setTransform(Ax, Ay);
					circleB.setTransform(Bx, By);
					circleC.setTransform(Cx, Cy);
					t+=0.01;
					if (m<1) {m+=0.01};
					stage.update();
				}
			}
			
			// Responsive canvas
			function handleResize() {
				var w = $('body').width(),
					h = $('body').height();
				stage.canvas.width = w;
				stage.canvas.height = h;
				var windowRatio = w/h;
				var scale = (windowRatio < 1) ? w/100 : h/100;
				container.scaleX = container.scaleY = scale;
				container.x = w/2;
				container.y = h/2
				stage.update();
			}
			$(window).resize(handleResize);
			handleResize();

		// Browser notification
		function sendNotify(title,text,fn,r) {
			Notification.requestPermission(function(p) {
				if (p == 'granted') {
					var n = new Notification(title, {
						body : text,
						tag  : 'pomodoro',
						icon : 'favicon.png',
						requireInteraction : (r) ? r : false,
					});
					n.onclick = (fn) ? fn : function() {this.close()};
					if(!r) {
						setTimeout(function(){
							n.close();
						},3000);
					}
				}
			});
		};

		// Timer callback
		function clockUpdate(min,sec) {
			function num(num) {
				// Leading zero
				return (num<10) ? '0' + num : num;
			}
			if (P.status.isTimer) {
				title.text(num(min) + ' : ' + num(sec));
			} else {
				title.text('Pomodoro');
				min = P.status.current;
				sec = 0;
			}
			drawClock(num(min),num(sec));
			clockMin.text(num(min));
			clockSec.text(num(sec));
		}

		// Start callback
		function startCb() {
			audio.trigger('stop');
			if (param.gui.notify) {
				var t = (P.status.isBreak) ? locale.runBr : locale.runPm;
				sendNotify(t,locale.close);
			}
			createjs.Ticker.setPaused(false);
			clockBtn.text(locale.stop).off('click').on('click', function() {
				(P.status.isBreak) ? P.stop() : P.reset();
			});
		}

		// Stop callback
		function stopCb() {
			if (param.gui.audio) {
				audio.trigger('play');
			}
			if (param.gui.notify) {
				var t = (P.status.isBreak) ? locale.break : locale.start;
				sendNotify(locale.stopped,t, P.start, true);
			}
			clockStat.text(P.status.countPm);
			resetCb();
		}

		// Reset callback
		function resetCb() {
			clockUpdate();
			createjs.Ticker.setPaused(true);
			clockBtn.text( (P.status.isBreak) ? locale.break : locale.start );
			clockBtn.off('click').on('click', function() {
				P.start();
			});
		}

		// Init
		resetCb();
		setTimeout(function(){stage.update()},100);
	}

// Pomodoro settings =============================================
	function pomodoroSettings() {
		var clockForm = $('.clock-settings'),
			uiForm    = $('.interface-settings'),
			setPm     = $('input[name=set-pm]'),
			setLb     = $('input[name=set-lb]'),
			setSb     = $('input[name=set-sb]'),
			setUi     = $('input[name=set-ui]'),
			setColor  = $('input[name=set-color]'),
			setAudio  = $('input[name=set-audio]'),
			setNotify = $('input[name=set-notify]');
		
		function changeUi(ui) {
			var ch = $('.clock-html'),
				cc = $('.clock-canvas');
			if (ui == 'canvas') {
				cc.show();
				ch.hide();
			} else {
				ch.show();
				cc.hide();
			}	
		}
		
		function changeColor(color) {
			var b = $('body');
			if (!b.hasClass(color)) {
				if (b.hasClass('modal-open')) {
					b.removeClass()
					 .addClass('modal-open')
					 .addClass(color);
				} else {
					b.removeClass()
					 .addClass(color);
				}
			}
		}
		
		function initSettings() {
			if (param.gui.notify) {Notification.requestPermission();}
			changeColor(param.gui.color);
			changeUi(param.gui.type);
		}

		// Form events
		clockForm.on('change', function() {
			function validateTime(o) {
				function showTooltip(m) {
					o.tooltip({
						trigger : 'manual',
						title : m
					}).tooltip('show');
					setTimeout(function(){
						o.tooltip('destroy');
					},2000);
				}
				if (o.val() < 1) {
					showTooltip(locale.minimum);
					o.val(1);
				} else if (o.val() > 999) {
					showTooltip(locale.maximum);
					o.val(999);
				} else {
					o.tooltip('destroy');
					o.val(Math.floor(o.val()));
				}
			}
			validateTime(setPm);
			validateTime(setLb);
			validateTime(setSb);
			param.time.pomodoro = parseInt(setPm.val());
			param.time.longbreak = parseInt(setLb.val());
			param.time.shortbreak = parseInt(setSb.val());
			Cookies.set('Pomodoro_param', param, {expires: 365});
			I.reset();
		});
		uiForm.on('change', function() {
			param.gui.type = setUi.parent().find(':checked').val();
			param.gui.color = setColor.parent().find(':checked').val();
			param.gui.audio = setAudio.prop('checked');
			param.gui.notify = setNotify.prop('checked');
			Cookies.set('Pomodoro_param', param, {expires: 365});
			initSettings();
		});
		
		// Fill form settings
		setPm.val(param.time.pomodoro);
		setLb.val(param.time.longbreak);
		setSb.val(param.time.shortbreak);
		setAudio.prop('checked', param.gui.audio);
		setNotify.prop('checked', param.gui.notify);
		setUi.parent().find('[value=' + param.gui.type + ']').prop('checked', true);
		setColor.parent().find('[value=' + param.gui.color + ']').prop('checked', true);
		
		// Init settings
		initSettings();
	}

// Pomodoro start ================================================
	jQuery(document).ready(function($) {
		I = new pomodoroInterface();
		pomodoroSettings();
	});