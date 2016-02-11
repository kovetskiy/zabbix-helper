// Zabbix Helper
// Version 1.1
// Author: Egor Kovetskiy <e.kovetskiy@gmail.com>

// This is a Greasemonkey user script.
//
// To install, you need Greasemonkey:
// https://addons.mozilla.org/en-US/firefox/addon/748
//
// Then restart Firefox and revisit this script.  Under Tools, there will be a
// new menu item to 'Install User Script'.
// Accept the default configuration  and install.
//
// If you are using Google Chrome, enable 'Developer mode' on the extensions
// page, click 'Load unpacked extension...' and specify directory where
// extension is located.
//
// To uninstall, go to Tools/Manage User Scripts, select 'Zabbix Heplper', and
// click Uninstall.

// ==UserScript==
// @name           Zabbix Helper
// @namespace      http://zabbix/
// @description    Everything is just the worst
// @match          http://zabbix.in.ngs.ru/*
// @version        1.0
// @include        http://zabbix.in.ngs.ru/*
// @grant          none
// ==/UserScript==


(function (){
var zabbixHelper = function() {
    // constants //

    var VERSION = '1.0';

    // options //

    var options = {
        'graphs': {
            'selectbox': {
                'size': 10,
                'regex': 'gi',
            },
        },
    };

    // utils //

    var log = function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift("[zabbix helper]");
        console.log.apply(console, args);
    };

    var $ = jQuery; // $ will be redeclared only in current closure

    // internal stuff //

    var getContext = function() {
        var header = $('.header .header_l.left').text();

        if (header == 'GRAPHS') {
            return 'graphs';
        }

        return 'unknown';
    };

    // handlers //

    var appendGraphsLabels = function(graphs, hosts) {
        $(graphs).each(function(index, graph) {
            $(graph).text(
                $(graph).text() + ": " + hosts[index].name
            );
        });
    };

    var getGraphHosts = function() {
        var hosts = [];

        $('#hostid').find('option').each(function(index, el) {
            var uid = $(el).val(),
                name = $(el).text();

            if (uid == 0) {
                return;
            }

            hosts.push({
                name: name,
                uid: uid,
            });
        });

        return hosts;
    };

    var enhanceGraphsLabels = function() {
        var groupGraphs    = [],
            groupSignature = null,
            hosts          = getGraphHosts(),
            graphs         = $('#graphid').find('option')

        $(graphs).each(function(index, graph) {
            var graphSignature = $(graph).text();

            if (groupGraphs.length == 0) {
                groupSignature = graphSignature;
                groupGraphs.push(graph)
                return;
            }

            if (graphSignature == groupSignature) {
                groupGraphs.push(graph)
            }

            if (groupGraphs.length > hosts.length) {
                // just do nothing, groupGraphs will be cleared when signature
                // changes
                return;
            }

            if (groupGraphs.length == hosts.length
             && (index+1 == graphs.length || graphSignature != groupSignature)) {
                appendGraphsLabels(groupGraphs, hosts)
            }

            if (graphSignature != groupSignature) {
                groupGraphs = [graph];
                groupSignature = graphSignature;
            }
        });
    };

    var enhanceGraphsSelectBox = function() {
        var graphs = $('#graphid')
        var size   = options.graphs.selectbox.size

        var charts   = [];
        var searcher = $('<input>')
        var wrapper = $('<div>')

        $(graphs).find('option').each(function() {
            charts.push({value: $(this).val(), text: $(this).text()});
        });

        searcher
            .attr('placeholder', 'search query')
            .bind('change keyup', function(){
                log('change keyup')
                var query = $.trim($(searcher).val());

                query = query.replace(/ /g, '.*')

                var regex = new RegExp(
                    query,
                    options.graphs.selectbox.regex
                );

                $(graphs).empty();

                $.each(charts, function(i) {
                    var option = charts[i];

                    if(option.text.match(regex) !== null) {
                        $(graphs).append(
                            $('<option>').text(option.text).val(option.value)
                        );
                    }
                });
            })
            .bind('blur', function() {
                log('searcher blur');
                setTimeout(function () {
                    if (!$(graphs).is(':focus')) {
                        $(graphs).hide();
                    }
                }, 1000);
            })
            .bind('keydown', function(keyDownEvent) {
                if (keyDownEvent.which == 13) {
                    log('keydown 13');
                    $(graphs)
                        .focus()
                        .find('option:first')
                        .attr('selected', 'selected')
                        .change();
                }
            })
            .bind('focus', function() {
                log('searcher show');
                $(graphs).show();
            });

        wrapper
            .attr('class', 'select')
            .css('position', 'relative')
            .css('display', 'inline');

        graphs
            .attr('size', size)
            .css('height', (parseInt(graphs.css('height'))*size)+'px')
            .css('width', graphs.width()+'px') // prevent dynamic change
            .css('position', 'absolute')
            .css('top', '20px')
            .css('left', '0px')
            .css('z-index', '999')
            .removeClass('select')
            .wrap(wrapper)
            .before(searcher);

        $(graphs).hide();


        //$('.select').css('vertical-align', 'middle')
    };

    var handleGraphs = function() {
        enhanceGraphsLabels();
        enhanceGraphsSelectBox();
    };

    // main //

    log("init v"+VERSION);

    var context = getContext();

    switch (context) {
        case 'graphs':
            log('handle graphs page');
            handleGraphs();
            break;

        default:
            log('unknown page context');
            break;
    }

}; // end of zabbixHelper body //

(function (helper) {
    var meta = document.querySelectorAll('meta[name="Author"]')
    if (!meta.length || meta[0].content != "Zabbix SIA") {
        return;
    }

	var script = document.createElement('script');
	script.textContent = '(' + helper.toString() + ')();';
	document.body.appendChild(script);
}(zabbixHelper));

})();
