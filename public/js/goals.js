var startup = function(campaign,scenario){
  firebase.database().ref('/campaigns/'+campaign).once("value",function(rawData){
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
/*
    d3.select("#calendarDiv").select("tbody")
      .selectAll("tr")
        .data()
        .enter().append("tr")
        .selectAll("td")
          .data(function(row){
            headers.map(function(col){
              return {
                col:col,row:row
              }
            })
          })
          .enter().append("td")
*/
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

    setValues(data.goals.defaults,function(err){
      console.log(err)
    })

  },function(err){
    if(err){
      console.log(err)
    }
  });
};

var calcTotals = function(){
  
}

var writeTotals = function(headers,vizDetails){
  var totalTds = d3.select("#totalContent").selectAll("td").filter(function(d){
    return d.row === "Input"
  }),
      voteYear      = headers.rows["Vote Total"][headers.rows["Vote Total"].length-1]["name"]
      parties       = new Object;

      vizDetails.voteTotals.filter(function(year){
        return year.year === voteYear
      })[0].votes.forEach(function(d){
        d.value = 0
      })

  headers.columns.filter(function(d){
    return d.name!="Data Type"
  }).map(function(group){
     group.subrows.map(function(subrow){
      var inputs =  d3.selectAll("input[data-group='"+group.name+"'][data-subgroup='"+subrow.name+"']").nodes().map(function(input){
        return {
            val:parseFloat(input.inputmask.unmaskedvalue()),
            table:d3.select(input).attr("data-table"),
            group:d3.select(input).attr("data-group"),
            subgroup:d3.select(input).attr("data-subgroup"),
            row:d3.select(input).attr("data-row"),
            subrow:d3.select(input).attr("data-subrow")}
      }),
      votingConstant = inputs.filter(function(input){
        return input.table!="Support"
      }).reduce(function(a,d,i,array){
        if(isNaN(a.val*d.val)){
          return 0
        }else{
          return a.val*d.val
        }
      })/100
      if(votingConstant>=0){
        totalTds.filter(function(td){
          return td.subgroup===subrow.name && td.group===group.name && td.subrow==="Total"
        }).text(

        numberWithCommas(Math.round(
          inputs.filter(function(input){
              return input.table==="Support"
            }).reduce(function(a,d,i,array){
              var val = 0;
              if(!isNaN(d.val)){
                val = d.val/100
              }

              totalTds.filter(function(td){
                return td.subgroup===d.subgroup && td.group===d.group && td.subrow ===d.subrow
              }).text(numberWithCommas(Math.round(votingConstant*val)))

              if(!parties[d.subrow]){
                parties[d.subrow] = 0
              }

              parties[d.subrow]+=(votingConstant*val)

              vizDetails.voteTotals.filter(function(year){
                return year.year === voteYear
              })[0].votes.filter(function(party){
                return party.party === d.subrow
              })[0].value+=(votingConstant*val)

              if(isNaN(a)){
                return (votingConstant*val)
              }else{
                return a+(votingConstant*val)
              }
            },0)))
          );
      }
    })
  });

  var groups = d3.select("#barChart").selectAll(".group")
    .data(vizDetails.voteTotals[0].votes)

    groups.enter().append(".group")
      .attr("transform", function(d){return "translate(" + vizDetails.barX1(d.party) + ",0)"})

    groups.merge(groups)
      .attr("transform", function(d){return "translate(" + vizDetails.barX1(d.party) + ",0)"})


  var bars = groups.selectAll("rect")
    .data(function(d){
      return vizDetails.voteTotals.map(function(row){
        if(row.year===voteYear){
          return {value:parties[d.party],year:row.year,party:d.party}
        }else{
          return {value:d.value,year:row.year,party:d.party}
        }
      })
    })

  bars.enter().append("rect")
    .attr("x", function(d){console.log(d); return vizDetails.barX2(d.year)})
    .attr("fill",function(d){return vizDetails.colorScale(d.party)})
    .attr("width", vizDetails.barX2.bandwidth())
    .attr("y", function(d){return vizDetails.barY(Math.round(d.value))})
    .attr("height", function(d){return vizDetails.vizHeight - vizDetails.barY(Math.round(d.value))})

    bars.merge(bars)
        .attr("x", function(d){return vizDetails.barX2(d.year)})
        .attr("fill",function(d){return vizDetails.colorScale(d.party)})
        .attr("width", vizDetails.barX2.bandwidth())
        .transition(vizDetails.t)
        .attr("y", function(d){return vizDetails.barY(Math.round(d.value))})
        .attr("height", function(d){return vizDetails.vizHeight - vizDetails.barY(Math.round(d.value))})

    bars.exit().remove()

    groups.exit().remove()

    var pieUpdate = d3.select("g#year-"+voteYear)
      .selectAll(".arc")
        .data(vizDetails.pie(Object.keys(parties).map(function(d){
          return {value:parties[d],party:d,year:voteYear}
        })))

    var arcs = pieUpdate.selectAll("path")
        .data(function(d){
          return [d]
        })

    arcs.merge(pieUpdate)
      .attr("d",vizDetails.arc)
      .style("fill",function(d){
        return vizDetails.colorScale(d.data.party)
      })

    arcs.enter().append("path")
      .attr("d",vizDetails.arc)
      .style("fill",function(d){
        return vizDetails.colorScale(d.data.party)
      })

    var totalVotes = new Object;

    vizDetails.voteTotals.forEach(function(year){
      totalVotes[year.year] = year.votes.reduce(function(a,d,i,array){
        return a+d.value
      },0)
    })

    groups.selectAll("rect")
      .on("mousemove",function(d){
        var html = "<div><b>Party: </b>"+d.party+"<br>"+
                        "<b>Year: </b>"+d.year+"<br>"+
                        "<b>Votes: </b>"+numberWithCommas(Math.round(d.value))+" <i>("+(100*d.value/totalVotes[d.year]).toFixed(1)+"%)</i>"+"<br>"+
                    "</div>"
        tooltipDisplay(html,d3.select(".tooltip"),d3.event)
      })
      .on("mouseout",function(){
        tooltipHide(d3.select(".tooltip"))
      })

    d3.select("#pieCharts").selectAll("path")
      .on("mousemove",function(d){
        var html = "<div><b>Party: </b>"+d.data.party+"<br>"+
                        "<b>Year: </b>"+d.data.year+"<br>"+
                        "<b>Votes: </b>"+numberWithCommas(Math.round(d.value))+" <i>("+(100*d.value/totalVotes[d.data.year]).toFixed(1)+"%)</i>"+"<br>"+
                    "</div>"
        tooltipDisplay(html,d3.select(".tooltip"),d3.event)
      })
      .on("mouseout",function(){
        tooltipHide(d3.select(".tooltip"))
      })
}

var setValues = function(defaults,cb){

  Object.keys(defaults).forEach(function(category){
    Object.keys(defaults[category]).forEach(function(input){
      d3.select("#"+category).select("#"+input).property("value",defaults[category][input])
    })
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
