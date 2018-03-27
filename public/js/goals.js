$(document).ready(function(){
  $(function() {
      $('.matchHeight').matchHeight();
  });
});

var colorScale = ["#0069c0","#2196f3","#00e676","#d50000","#0069c0","#2196f3","#00e676","#d50000"]

var startup = function(campaign,scenario){
  firebase.database().ref('/campaigns/'+campaign+'/goals').once("value",function(rawData){
      var data        = rawData.val(),
          colWidth    = 0,
          margins     = {top:10,right:10,bottom:30,left:40}
          /*
          vizWidth    = d3.select("#totalViz").select("#barChart").node().getBoundingClientRect().width  - margins.right - margins.left,
          vizHeight   = d3.select("#vizDiv").node().getBoundingClientRect().height - margins.top - margins.bottom,
          g           = d3.select("#totalViz").selectAll("div").append("svg").attr("width",d3.select("#totalViz").select("#barChart").node().getBoundingClientRect().width).attr("height",d3.select("#vizDiv").node().getBoundingClientRect().height)
                              .append("g").attr("transform","translate("+margins.left+","+margins.top+")"),
          barX1       = d3.scaleBand().rangeRound([0,vizWidth]).paddingInner(.1),
          barX2       = d3.scaleBand().padding(.05),
          barY        = d3.scaleLinear().rangeRound([vizHeight,0]),
          colorScale  = d3.scaleOrdinal(["#2196f3","#d50000","#00e676"]).domain(["Dem","GOP","Other"]),
          radius      = Math.min(vizWidth,vizHeight/2)/2,
          arc         = d3.arc().outerRadius(radius - 10).innerRadius(radius/2),
          pie         = d3.pie().value(function(d){return d.value}),
          t           = d3.transition().duration(1000).ease(d3.easeLinear),
          voteTotals  = data.headers.rows["Vote Total"].map(function(row){
                          return {year:row.name,votes:row.subrows.map(function(subrow){
                            return {party:subrow.name,value:data.data.filter(function(d){
                              return d.table === "Vote Total" && d.group!="Data Type" && d.subrow === subrow.name && d.row === parseInt(row.name)
                            }).reduce(function(a,data,i,array){
                              return a+parseFloat(data.value)
                            },0)}
                          })}
                        }),
          vizDetails  = {
            margins:margins,
            vizWidth:vizWidth,
            vizHeight:vizHeight,
            g:g,
            barX1:barX1,
            barX2:barX2,
            barY:barY,
            colorScale:colorScale,
            arc:arc,
            pie:pie,
            t:t,
            voteTotals:voteTotals
          }
*/

    $("#start-date").val(new Date().toISOString().substr(0, 10))
    $("#end-date").val('2018-12-01')

    //console.log(getWeeks(new Date($("#start-date").val()),new Date($("#end-date").val()),parseInt($("#week-start").val())))

    var months = getMonths(new Date($("#start-date").val()),new Date($("#end-date").val()));
        months.unshift('');
        headers = months.map(function(d,i){
          if(i===0){
            return {
              name:"header",
              label:d.split(' ')[1],
              width:"20%",
              rawDate:d
            }
          }else{
            return {
              name:d.split(' ')[1],
              label:d.split(' ')[1],
              width:(80/months.length)+"%",
              rawDate:d
            }
          }
        })

    var header = d3.select("#calendarDiv").select("thead")
      .append("tr").selectAll("th")
        .data(headers)
        .enter().append("th")
          .attr("width",function(d){
            return d.width
          })
          .attr("class","row")
          .append("th")
            .attr("class","col-xs-12")

        header.filter(function(d){
          return d.name != "header"
        }).append("div")
            .text(function(d){
              return d.label
            })

        header.filter(function(d){
          return d.name != "header"
        }).append("input")
            .attr("class","form-control perc")
            .attr("id",function(d){
              return d.rawDate.split(' ')[1] + "-" + d.rawDate.split(' ')[3]
            })

      var calendarTable = d3.select("#calendarContent")
          .select("table")
          .selectAll("tbody")
            .data(Object.keys(data.categories).map(function(d){
              return {
                name:d,
                label:data.categories[d].label,
                rows:data.categories[d].rows
              }
            }))
            .enter().append("tbody")

        calendarTable.append("h4")
              .text(function(d){
                return d.label
              })
              .attr("data-toggle","collapse")
              .attr("data-target","#inputContent")

    calendarTable.selectAll("tr")
          .data(function(d){
            return d.rows
          })
        .enter().append("tr")
        .selectAll("td")
          .data(function(row){
            return headers.map(function(col){
              if(col.name==="header"){
                return {
                  col:col,row:row,val:row.label
                }
              }else{
                return {
                  col:col,row:row,val:""
                }
              }
            })
          })
          .enter().append("td")
            .attr("width",function(d){
              return d.col.width
            })
            .text(function(d){
              return d.val
            })

    $(".int").inputmask({
      "alias": "decimal",
      'groupSeparator':',',
      'autoGroup':true,
      min:0,
      onBeforeMask:function(value){
        return Math.round(parseFloat(value)).toString()
      }});
    $(".perc").inputmask({
      "regex": "([1-9]([0-9])?|0)?%",
      onBeforeMask:function(value,opts){
        return Math.round(parseFloat(value)*100).toString()
      }
    });

    $("#slider").slider({
      value:.2,
      min:.1,
      max:.3,
      step:.01,
      slide:function(e,ui){
        console.log(ui.value)
        writeTotals()
      }
    }).slider("pips",{
      rest:false,
      labels:{
        "first":"10%",
        "last":"30%"
      }
    }).slider("float",{
      formatLabel:function(val){
        return (val*100).toFixed(0) + "%"
      }
    })

    d3.selectAll("input").on("change",function(){
      writeTotals();
    })

    setValues(data.defaults,function(err){
      writeTotals();
    })

  },function(err){
    if(err){
      console.log(err)
    }
  });
};

var getTotals = function(){
  var totals     = d3.select("#pathway-totals").selectAll("input").nodes(),
      percentage = $("#slider").slider("value"),
      data       = new Object;

  totals.forEach(function(d){
    data[d3.select(d).attr("id").split("-")[0]] = (d.inputmask.unmaskedvalue()*percentage)
  })

  return data
}

var calcTotals = function(){

  var programTotals             = getTotals(),
      data                      = new Object;
      data.totals               = new Object;
      data.totals.totals        = new Object;
      data.totals.totals.conversions      = 0
      data.totals.totals.contacts         = 0
      data.totals.totals.attempts         = 0
      data.totals.totals.shifts           = 0
      metrics                   = Object.keys(programTotals).forEach(function(program){
      data[program]             = new Object;
    return d3.select("#"+program).select("tr").selectAll("input").nodes().forEach(function(input){
      var id                  = d3.select(input).attr("id"),
          tactic              = id.split('-')[0],
          metric              = id.split('-')[1],
          prog                = parseFloat(d3.select("#"+tactic+"-program").node().inputmask.unmaskedvalue())/100,
          conv                = parseFloat(d3.select("#"+tactic+"-conversion").node().inputmask.unmaskedvalue())/100,
          cont                = parseFloat(d3.select("#"+tactic+"-contact").node().inputmask.unmaskedvalue())/100,
          _conv               = programTotals[program] * prog,
          _cont               = _conv/conv,
          _attm               = _cont/cont,
          _shift              = null;
          data.totals[tactic] = new Object;
          data.totals[tactic]["conversions"]  = 0
          data.totals[tactic]["contacts"]     = 0
          data.totals[tactic]["attempts"]     = 0
          data.totals[tactic]["shifts"]       = 0

          if(d3.select("#"+tactic+"-attempts").node()){
            shift   = d3.select("#"+tactic+"-attempts").node().inputmask.unmaskedvalue(),
            _shift  = _attm/shift
          }

          data.totals.totals.conversions      += _conv
          data.totals.totals.contacts         += _cont
          data.totals.totals.attempts         += _attm
          data.totals.totals.shifts           += _shift

          data.totals[tactic]["conversions"]  += _conv
          data.totals[tactic]["contacts"]     += _cont
          data.totals[tactic]["attempts"]     += _attm
          data.totals[tactic]["shifts"]       += _shift

           data[program][tactic] = {
              conversions :_conv,
              contacts    :_cont,
              attempts    :_attm,
              shifts      :_shift
          }
    })
  })

  return data
}

var writeTotals = function(){
  var totals = calcTotals()

  d3.selectAll("#calendarContent").selectAll("td").filter(function(td){
    return td.col.name != "header"
  }).each(function(td){
    d3.select(this).text(function(d){
      var ramp = d3.select("input#"+td.col.rawDate.split(' ')[1] + "-" + td.col.rawDate.split(' ')[3]).node().inputmask.unmaskedvalue()
      return numberWithCommas((totals.totals[td.row.name.split('-')[0]][td.row.name.split('-')[1]] * (parseInt(ramp)/100)).toFixed(0))
    })
  })

  createViz(totals)
}

var setValues = function(defaults,cb){
  Object.keys(defaults).forEach(function(category){
    Object.keys(defaults[category]).forEach(function(input){
      d3.select("#"+category).select("#"+input).property("value",defaults[category][input])
    })
  })
  return cb()
}

var createViz = function(totals){
  console.log(totals)

  var table       = d3.select("#input-vizDiv").select("#totalsTable").select("tbody"),
      time        = d3.select("#input-vizDiv").select("#timeSeries"),
      pie         = d3.select("#input-vizDiv").select("#pie").append("svg"),
      pieWidth    = pie.node().getBoundingClientRect().width
      pieHeight   = pie.node().getBoundingClientRect().height
      radius      = Math.min(pieWidth,pieHeight)/2,
      arc         = d3.arc().outerRadius(radius - 10).innerRadius(radius/2),
      pieFunc     = d3.pie().value(function(d){return d});

      table.selectAll("td").text(function(d){
        return numberWithCommas(Math.round(totals.totals.totals[d3.select(this).attr("id")]))
      })

      var pieG = pie.append("g")
        .attr("transform",function(d,i){
          return "translate("+pieWidth/2+","+radius+")"
        })
        .attr("height",function(d){
          return pieHeight
        })

      pieG.selectAll(".arc")
          .data(function(d){
            return pieFunc(Object.keys(totals.totals).filter(function(d){
              return d!="totals"
            }).map(function(d){
              return totals.totals[d].attempts
            }))
          }).enter().append("g")
            .attr("class","arc")
        .append("path")
          .style("fill",function(d,i){
            return colorScale[i]
          })
          .style("opacity",function(d,i){
            console.log(Math.round(i/4))
            return 1/(Math.round(i/4))
          })
          .attr("d",arc)
          .on("mousemove",function(d){
            var html = "<div><b>Tactic: </b>"+d.party+"<br>"+
                            "<b>Year: </b>"+d.year+"<br>"+
                            "<b>Votes: </b>"+numberWithCommas(Math.round(d.value))+" <i>("+(100*d.value/totalVotes[d.year]).toFixed(1)+"%)</i>"+"<br>"+
                        "</div>"
            tooltipDisplay(html,d3.select(".tooltip"),d3.event)
          })
          .on("mouseout",function(d){
            tooltipHide()
          })
}

var reset = function(){
//  d3.select("#calendarDiv").select("thead").remove()
//  d3.select("#calendarDiv").select("tbody").remove()
}

var saveScenario = function(name,campaign){
  var data = d3.selectAll("input").filter(function(d){
    return d3.select(this).attr("data-row") === "Input"
  }).nodes().map(function(input){
    var group     = d3.select(input).attr("data-group"),
        row       = d3.select(input).attr("data-row"),
        subgroup  = d3.select(input).attr("data-subgroup"),
        subrow    = d3.select(input).attr("data-subrow"),
        table     = d3.select(input).attr("data-table"),
        value     = parseFloat(input.inputmask.unmaskedvalue())

        if(isNaN(value)){
          value = 0
        }

        if(table!="Population"){
          value=value/100
        }

    return {
        group:group,
        row:row,
        subgroup:subgroup,
        subrow:subrow,
        table:table,
        value:value
    }
  })
  firebase.database().ref('/campaigns/'+campaign+'/scenarios/'+generateId(8)).set({name:name,data:data})
}
