// contains functions for formatting raw data
var data_process = (function() {

	var exports = {};

	// sorts events into chronological order and separates them into different event types.
	// returns an object with event types as keys and arrays as values.
	var process_event_types = function(data) {

		var video_events = []
		var problem_events = []

		// sort events so they are ordered chronologically with the oldest event first
		data.sort(function(a,b){
		  a = new Date(a.time);
		  b = new Date(b.time);
		  return a<b?-1:a>b?1:0;
		});

		// put individual events into correct array
		for (var i = 0; i < data.length; i++) {
			if (data[i].event_type == "play_video" || data[i].event_type == "pause_video") {

				video_events.push(data[i]);

			} else if (data[i].event_type == "problem_check") {

				problem_events.push(data[i]);

			}
		}
		return {"video_events":video_events, "problem_events":problem_events}
	}

	var round_date = function(date) {
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);

	}

	// takes an array of arrays containing chronologically sorted event objects
	// returns an array containing arrays of "y" values for each hour for each
	// array entered. Each entered array contains an array of events of different types.
	var format_events = function(events) {
		var out = {};

		// if the entered arrays do not have values, return an empty object. else, create arrays
		// to chart.
		if (events[0].length == 0 || events[1].length == 0) {

			return out;

		} else {

			// these two variables will be filled and returned
			var stacked_data = [];
			var total_events_by_hour = [];

			// find the first event and the input array containing it
			var first_event = new Date(events[0][0].time);
			var first_event_list = events[0];
			for (var index = 1; index < events.length; index++) {
				var looped_event = new Date(events[index][0].time);
				if (looped_event.getTime() < first_event.getTime()) {
					first_event = looped_event;
					first_event_type = events[index];
				}
			}
			round_date(first_event);

			// find the last event and the input array containing it
			var last_event = new Date(events[0][events[0].length - 1].time);
			var last_event_type = events[0];
			for (var index = 1; index < events.length; index++) {
				var looped_event = new Date(events[index][events[index].length - 1].time);
				if (looped_event.getTime() > last_event.getTime()) {
					last_event = looped_event;
					last_event_type = events[index];
				}
			}
			round_date(last_event);

			var events_by_hour = {};

			var first_day = new Date(first_event.getTime());
			first_day.setHours(0);
			var last_day = new Date(last_event.getTime());
			last_day.setHours(0);
			var num_days = Math.ceil((last_day.getTime() - first_day.getTime())/(3600 * 1000 * 24));

			for (var i = 0; i <= num_days; i++) {
				var ms_day = 3600*1000*24;
				
				var event_date = new Date(first_event.getTime() + i*ms_day);
				var event_day = (event_date.getMonth() + 1) +"/"+(event_date.getDate());
				events_by_hour[event_day] = {};

				for (var j = 0; j < 24; j++) {
			 		events_by_hour[event_day][j] = [];
			 	}
			}


			for (var index = 0; index < events.length; index++) {

				var num_events = [];
				var filled_events_by_hour = $.extend(true, {}, events_by_hour)

				// make events_by_hour
				// looks like {"date" : {0: [...], 1: [...], ...}}
				for (var i = 0; i < events[index].length; i++) {

					var event_date = new Date(events[index][i].time);
					var event_day = (event_date.getMonth() + 1) +"/"+event_date.getDate();
					var event_hour = event_date.getHours();

					filled_events_by_hour[event_day][event_hour].push(event);
				}

				// make num_events from events_by_hour
				for (var i in events_by_hour) {
					for (var j in events_by_hour[i]) {
						num_events.push({"y": filled_events_by_hour[i][j].length});
					}
				}

				total_events_by_hour.push(filled_events_by_hour);
				stacked_data.push(num_events);
			}

			out.stacked_data = stacked_data;
			out.events_by_hour = total_events_by_hour;
			out.first_event = first_event;
			out.last_event = last_event;
			return out;

		}
	}
		exports.round_date = round_date;
		exports.process_event_types = process_event_types;
		exports.format_events = format_events;

		return exports;
	
})();

// object with assignment names as keys and Date objects as values, represents when assignments
// are due in the class. 
var due_dates = {"PSet 1": new Date(2013, 8, 10, 21, 0, 0, 0), "PSet 2": new Date(2013, 8, 20, 21, 0, 0, 0), "Quiz 1":new Date(2013, 8, 25, 18, 0, 0, 0)}

var format_stackable_data = function(data) {
	
	var video_events = data_process.process_event_types(data).video_events
	var problem_events = data_process.process_event_types(data).problem_events

	var data = data_process.format_events([problem_events, video_events]).stacked_data
	var first_event = data_process.format_events([problem_events, video_events]).first_event
	var last_event = data_process.format_events([problem_events, video_events]).last_event
	return {"data": data, "first_event": first_event, "last_event": last_event}
}

var stacked_chart = (function() {

	var exports = {};

	var outer_height = 300;
	var outer_width = 3000;

	var margin = { top: 20, right: 20, bottom: 20, left: 20 };

	var chart_width = outer_width - margin.left - margin.right;
	var chart_height = outer_height - margin.top - margin.bottom;

	var legend_text = {0: "Problem Events", 1: "Video Events"};

	var setup = function(data) {

		if (data.data[0].length < 200) {
			outer_width = 1200;
			chart_width = outer_width - margin.left - margin.right;
		}

		if(data.data[0].length > 200) {
			outer_width = 3000;
			chart_width = outer_width - margin.left - margin.right;
		}
		$('.chart').remove();
		$('.due-dates').remove();
		$('.legend').remove();

		var stack = d3.layout.stack();
		var stacked_data = stack(data.data);

		var y_stack_max = d3.max(stacked_data, function(layer) {
							return d3.max(layer, function(d) { return d.y +d.y0; })
						});

		var y_group_max = d3.max(stacked_data, function(layer) { return d3.max(layer, function(d) { return d.y })})

		var x_scale = d3.scale.ordinal()
						.domain(d3.range(data.data[0].length)).rangeBands([0, chart_width]);
		var x_label_scale = d3.time.scale()
						.domain([data.first_event, data.last_event]).range([0, chart_width]).nice(d3.time.day);
		var y_scale = d3.scale.linear()
						.domain([0, y_stack_max]).range([chart_height, 0]);
		var color = d3.scale.linear()
					    .domain([0, 2])
					    .range(["#aad", "#556"]);

		var constant_labels = d3.select(".chart-div")
						.append("svg")
							.attr("class", "labels")
							.attr("height", outer_height)
							.attr("width", "10%")
						.append("g")
							.attr("class", "labels-holder")
							.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		$(".chart-div").append($("<div class='chart-holder'></div>"));

		var legend = d3.select(".chart-div")
						.append("svg")
							.attr("class", "legend")
							.attr("height", outer_height)
							.attr("width", "10%")
							.attr("position", "relative")
							.attr("float", "right")
						.append("g")
							.attr("y", 25)
							.attr("class", "legend-holder");

		legend.selectAll("rect")
				.data(data.data)
				.enter()
			.append("rect")
				.attr("x", 0)
				.attr("y", function(d, i) { return i * 20 + 20; })
				.attr("width", 10)
				.attr("height", 10)
				.style("fill", function(d, i) { return color(i); });

		legend.selectAll("text")
				.data(data.data)
				.enter()
			.append("text")
				.attr("x", 12)
				.attr("y", function(d, i) { return i * 20 + 30; })
				.attr("font-size", "9px")
				.text(function(d, i) {return legend_text[i];});


		// counters svg annoyingness when making new chart
		if ($('.labels').length > 1) {
			$(".labels")[1].parentNode.insertBefore($(".labels")[1],$(".labels")[1].parentNode.firstChild)
			$(".labels")[1].remove()
		}

		var chart = d3.select(".chart-holder")
						.append("svg")
							.attr("class", "chart")
							.attr("height", outer_height)
							.attr("width", outer_width)
						.append("g")
							.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

		chart.selectAll("line").remove()

		chart.selectAll("line").data(y_scale.ticks(10))
			.enter().append("line")
				.attr("x1", 0)
				.attr("x2", chart_width)
				.attr("y1", y_scale)
				.attr("y2", y_scale)
				.attr("opacity", ".5");

		constant_labels.selectAll(".y-scale-label").data(y_scale.ticks(10))
			.enter().append("text")
				.attr("class", "y-scale-label")
				.attr("x", "60%")
				.attr("y", y_scale)
				.attr("text-anchor", "end")
				.attr("dy", "0.3em")
				.attr("dx", -margin.left/8)
				.attr("font-size", "9px")
				.text(String);

		var xAxis = d3.svg.axis()
		    .scale(x_label_scale)
		    .orient('bottom')
		    .ticks(d3.time.days, 1)
		    .tickFormat(d3.time.format('%a %d'))
		    .tickSize(0)
		    .tickPadding(50);
		
		var xTicks = d3.svg.axis()
		    .scale(x_label_scale)
		    .orient('bottom')
		    .ticks(d3.time.hours, 12)
		    .tickFormat("|")
		    .tickSize(0)
		    .tickPadding(41);

		chart.append('g')
			.attr("class", "due-dates")
			.attr('transform', 'translate(0, ' + (chart_height - margin.top - margin.bottom) + ')');

		chart.selectAll('.x-axis').remove();
		chart.selectAll('.x-ticks').remove();

		chart.append('g')
		    .attr('class', 'x-axis')
		    .attr('transform', 'translate(0, ' + (chart_height - margin.top - margin.bottom) + ')')
		    .call(xAxis);	

		chart.append('g')
		    .attr('class', 'x-ticks')
		    .attr('transform', 'translate(0, ' + (chart_height - margin.top - margin.bottom) + ')')
		    .attr('opacity', '.3')
		    .call(xTicks);

		for (date in due_dates) {
			var first_day = new Date(data.first_event.getTime())
			data_process.round_date(first_day)
			first_day.setHours(0)
			var diff_hours = Math.floor((due_dates[date].getTime() - first_day.getTime())/(3600*1000));

			var dueTick = chart.append("g")
							.attr("class", "date-tick")
							.attr("transform", 'translate('+x_scale.rangeBand() * (diff_hours)+', '+(chart_height+27)+')');
			var dueMark = chart.append("g")
							.attr("class", "date-tick")
							.attr("transform", 'translate('+x_scale.rangeBand() * (diff_hours)+', '+(chart_height+8)+')');
			dueMark.append("text")
				.attr("text-anchor", "middle")
				.attr('opacity', '.5')
				.text("|");
			dueTick.append('text')
				.attr("text-anchor", "middle")
				.attr('opacity', '.5')
				.text(date);
		}	

		var layer_groups = chart.selectAll(".layer").data(stacked_data)
								.enter().append('g')
									.attr("class", "layer")
									.style("fill", function(d, i) { return color(i); });
		var layer_group = chart.selectAll(".layer").data(stacked_data)
		layer_group.exit().remove()

		var rects = layer_groups.selectAll("rect").data(function(d) { return d; })
						.enter().append("rect")
							.attr("x", function(d, i) { return x_scale(i) })
							.attr("y", function(d) {return y_scale(d.y0 + d.y)})
							.attr("width", x_scale.rangeBand())
							.attr("height", function(d) {return y_scale(d.y0) - y_scale(d.y0 + d.y)})
		var rect = layer_groups.selectAll("rect").data(function(d) { return d; })
		rect.exit().remove()

	}

	// called to redraw data if new data has same time period as old data
	var redraw = function(data) {
		var stack = d3.layout.stack();
		if (data.data == undefined) {
			
			var layer_groups = d3.select('.chart').selectAll(".layer")
			
			layer_groups.selectAll("rect")
				.transition()
				.duration(2000)
				.attr("height", 0)
				.attr("y", chart_height)

		} else {

			var stacked_data = stack(data.data)

			var y_stack_max = d3.max(stacked_data, function(layer) {
								return d3.max(layer, function(d) { return d.y +d.y0
								})
							});
			var x_scale = d3.scale.ordinal()
							.domain(d3.range(data.data[0].length)).rangeBands([0, chart_width]);
			var x_label_scale = d3.time.scale()
							.domain([data.first_event, data.last_event]).range([0, chart_width]).nice(d3.time.day);
			var y_scale = d3.scale.linear()
							.domain([0, y_stack_max]).range([chart_height, 0]);
			d3.select('.chart').selectAll("line").remove()
			d3.select('.chart').selectAll("line").data(y_scale.ticks(10))
				.enter().append("line")
					.attr("x1", 0)
					.attr("x2", chart_width)
					.attr("y1", y_scale)
					.attr("y2", y_scale)
					.attr("opacity", ".5")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			d3.select('.labels').selectAll(".y-scale-label").remove()
			d3.select('.labels').selectAll(".labels-holder").remove()

			d3.select('.labels').selectAll(".y-scale-label").data(y_scale.ticks(10))
				.enter().append("text")
					.attr("class", "y-scale-label")
					.attr("x", "50%")
					.attr("y", y_scale)
					.attr("text-anchor", "end")
					.attr("dy", "0.3em")
					.attr("dx", -margin.left/8)
					.attr("font-size", "80%")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
					.text(String);


			var layer_groups = d3.select('.chart').selectAll(".layer").data(stacked_data)
			
			layer_groups.selectAll("rect").data(function(d) { return d; })
			 .transition()
			 .duration(2000)
	 		 .attr("x", function(d, i) { return x_scale(i) })
			 .attr("y", function(d) {return y_scale(d.y0 + d.y)})
			 .attr("width", x_scale.rangeBand())
			 .attr("height", function(d) {return y_scale(d.y0) - y_scale(d.y0 + d.y)})
		}
	}

	exports.setup = setup;
	exports.redraw = redraw;

	return exports

})();

$(document).ready(function() {
	$(".chart-div").each(function() {
		stacked_chart.setup(format_stackable_data(generated_data_graded))
	})
})