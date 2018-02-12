var startup = function(campaign,scenario){
  firebase.database().ref('/campaigns/'+campaign).once("value",function(rawData){
    console.log(rawData.val())
      var data        = rawData.val(),
          tables      = d3.selectAll(".contentRow:not(.headerRow)").append("table")
                          .datum(function(d){
                            return d3.select(this.parentNode).attr("data-category")
                          })
                          .attr("class","table"),
          colWidth    = 0,
          margins     = {top:10,right:10,bottom:30,left:45},
          vizWidth    = d3.select("#totalViz").select("#barChart").node().getBoundingClientRect().width  - margins.right - margins.left,
          vizHeight   = d3.select("#vizDiv").node().getBoundingClientRect().height - margins.top - margins.bottom,
          g           = d3.select("#totalViz").selectAll("div").append("svg").attr("width",d3.select("#totalViz").select("#barChart").node().getBoundingClientRect().width).attr("height",d3.select("#vizDiv").node().getBoundingClientRect().height)
                              .append("g").attr("transform","translate("+margins.left+","+margins.top+")"),
          barX1       = d3.scaleBand().rangeRound([0,vizWidth]).paddingInner(.1),
          barX2       = d3.scaleBand().padding(.05),
          barY        = d3.scaleLinear().rangeRound([vizHeight,0]),
          colorScale  = d3.scaleOrdinal(["#2196f3","#d50000","#00e676","#0069c0"]).domain(["Dem","GOP","Other","Other"]),
          radius      = Math.min(vizWidth,vizHeight/2)/2,
          arc         = d3.arc().outerRadius(radius - 10).innerRadius(radius/2),
          pie         = d3.pie().value(function(d){return d.value}),
          t           = d3.transition().duration(1000).ease(d3.easeLinear),
          voteTotals  = data.headers.rows["Vote Total"].map(function(row){
                          return {year:row.name,votes:row.subrows.map(function(subrow){
                            console.log(data.data)
                            console.log(subrow.name)
                            console.log(row.name)
                            console.log(data.data.filter(function(d){
                              return d.table === "Vote Total" && d.group!="Data Type" && d.subrow === subrow.name && parseInt(d.row) === parseInt(row.name)
                            }))
                            return {party:subrow.name,value:data.data.filter(function(d){
                              return d.table === "Vote Total" && d.group!="Data Type" && d.subrow === subrow.name && parseInt(d.row) === parseInt(row.name)
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

          d3.select("#scenarioDropdown").selectAll("li")
            .data(Object.keys(data.scenarios).map(function(d){
              return {name:data.scenarios[d].name,key:d}
            }))
            .enter().append("li")
              .attr("class","loadScenario")
              .attr("data-key",function(d){
                return d.key
              })
              .on("click",function(d){
                reset()
                startup(state.campaign,d3.select(this).attr("data-key"))
              })
              .append("a")
                .text(function(d){
                  return d.name
                })

          var g = d3.select("#pieCharts").select("g")
            .selectAll("g")
              .data(voteTotals)
              .enter().append("g")
              .attr("transform",function(d,i){
                return "translate("+vizWidth/2+","+(radius*((i*2)+1))+")"
              })
              .attr("id",function(d){
                return "year-"+d.year
              })
              .attr("height",function(d){
                return vizHeight/data.headers.rows["Vote Total"].length
              })

              g.append("text")
                .attr("transform",function(d,i){
                  return "translate(-"+radius+",-"+radius+")"
                })
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "start")
                .text(function(d){
                  return d.year
                });

            var pieArc = g.selectAll(".arc")
                .data(function(d){
                  return pie(d.votes.map(function(line){
                    line.year = d.year
                    return line
                  }))
                }).enter().append("g")
                  .attr("class","arc")

            pieArc.append("path")
              .style("fill",function(d){
                return colorScale(d.data.party)
              })
              .attr("d",arc)

          vizDetails.barX1.domain(data.headers.rows["Vote Total"][0].subrows.map(function(d){
            return d.name
          }));
          vizDetails.barX2.domain(data.headers.rows["Vote Total"].map(function(d){
            return d.name
          })).rangeRound([0,barX1.bandwidth()]);
          vizDetails.barY.domain([0,d3.max(data.data.filter(function(d){
            return d.subrow === "Registration" && d.group!="Data Type";
          }),function(d){
            return parseInt(d.value);
          })]).nice();

          var barGroups = d3.select("#barChart").select("g").append("g")
            .selectAll("g")
              .data(voteTotals[0].votes)
              .enter().append("g")
                .attr("class","group")
                .attr("transform", function(d){return "translate(" + barX1(d.party) + ",0)"})

          barGroups.append("g")
            .attr("class","axis")
            .attr("transform", "translate(0," + vizHeight + ")")
            .call(d3.axisBottom(barX2));

            d3.select("#barChart").select("g").append("g")
              .attr("class", "axis")
              .call(d3.axisLeft(barY))
            .append("text")
              .attr("x", 2)
              .attr("y", 5)
              .attr("dy", "0.5em")
              .attr("fill", "#000")
              .attr("font-weight", "bold")
              .attr("text-anchor", "start")
              .text("Votes");

            barGroups.selectAll("rect")
                  .data(function(d){
                    return voteTotals.map(function(row){
                      if(row.year===data.headers.rows["Vote Total"][data.headers.rows["Vote Total"].length-1]["name"]){
                        return {value:0,year:row.year,party:d.party}
                      }else{
                        return {value:d.value,year:row.year,party:d.party}
                      }
                    })
                  })
                  .enter().append("rect")
                    .attr("x", function(d){return barX2(d.year)})
                    .attr("y", function(d){return barY(0)})
                    .attr("fill",function(d){return colorScale(d.party)})
                    .style("opacity",function(d){
                      if(d.value>0){
                        return .4
                      }
                    })
                    .attr("width", barX2.bandwidth())
                    .attr("height", 0)

                barGroups.selectAll("rect")
                  .transition(t)
                  .attr("y", function(d){return barY(d.value)})
                  .attr("height", function(d){return vizHeight - barY(d.value)})

        data.headers.columns.forEach(function(d){
          if(d.subrows.length>colWidth){
            colWidth = d.subrows.length
          }
        });

        var headerRows = d3.selectAll(".headerRow")
        .append("table")
          .attr("class","table table-headers")
          .append("thead").append("tr")
          .selectAll("th")
            .data(data.headers.columns)
            .enter().append("th")
            .attr("width",function(d,i){
              if(i===0){
                return "20%"
              }else{
                return (1/(data.headers.columns.length))*100 + "%"
              }
            })
            .append("div")
              .attr("class",function(d,i){
                if(i===0){
                  return "categoryTitle"
                }else{
                  return "slider"
                }
              })

        headerRows.attr("data-table",function(d){
          return d3.select(d3.select(this).node().parentNode.parentNode.parentNode.parentNode.parentNode).attr("data-table")
        })

        headerRows.filter(function(d,i){
          return d3.select(this).attr("class") === "categoryTitle"
        }).append("h4")
          .attr("class","categoryTitle")
          .text(function(d){
            return d3.select(this.parentNode).attr("data-table")
          })

        $(function(){
          $(".slider").slider({
            value:0,
            min:-.5,
            max:.5,
            step:.05,
            slide:function(e,ui){
              var tableName = d3.select(this.parentNode.parentNode.parentNode.parentNode.parentNode).attr("data-table"),
                  inputData = d3.select(this.parentNode).datum(),
                  subrow    = "",
                  change    = 0,
                  totalDemoSupport = 0,
                  _subrow = data.headers.rows["Support"][data.headers.rows["Support"].length-1].subrows[0].name
                  if(tableName==="Support"){subrow = "[data-subrow='"+_subrow+"']"}
                  console.log(subrow)

                  inputs =  d3.selectAll("input[data-table='"+tableName+"'][data-group='"+inputData.name+"']"+subrow).each(function(d){
                    var value = parseFloat(d3.select(this).attr("data-startValue"))*(1+ui.value)
                    if(tableName!="Population"&&value>.99){value=.99}
                    change = d3.select(this).attr("data-startValue") - value
                    d3.select(this).property("value",value)
                  })

                  if(tableName==="Support"){
                    inputs =  d3.selectAll("input[data-table='"+tableName+"'][data-group='"+inputData.name+"']").filter(function(d){
                      return d3.select(this).attr("data-subrow") != _subrow && d3.select(this).attr("data-subrow") != "Other"
                    }).each(function(d){
                      var value     = parseFloat(d3.select(this).attr("data-startValue"))+(change/(data.headers.rows["Support"][data.headers.rows["Support"].length-1].subrows.length/2)),
                          subgroup  = d3.select(this).attr("data-subgroup")
                      if(value>.99){value=.99}
                      if(value<.01){value=.01}
                      d3.select(this).property("value",value)


                      totalDemoSupport = d3.selectAll("input[data-table='"+tableName+"'][data-group='"+inputData.name+"'][data-subgroup='"+subgroup+"']").nodes().reduce(function(a,d,i,array){
                        var value = parseInt(d.inputmask.unmaskedvalue())
                        if(!d.inputmask.unmaskedvalue()){value = 0}
                        return a+value
                      },0)

                      if(totalDemoSupport>100){
                        d3.selectAll("input[data-table='"+tableName+"'][data-group='"+inputData.name+"'][data-subgroup='"+subgroup+"'][data-subrow='Other']").property("value",Math.max(0,100-totalDemoSupport)/100).attr("class","form-control perc");
                      }
                      if(totalDemoSupport<100){
                        d3.selectAll("input[data-table='"+tableName+"'][data-group='"+inputData.name+"'][data-subgroup='"+subgroup+"'][data-subrow='Other']").property("value",Math.max(0,100-totalDemoSupport)/100).attr("class","form-control perc");
                      }

                    })
                  }

              writeTotals(data.headers,vizDetails)
            }
          }).slider("pips",{
            step:5,
            labels:[]
          })
        })

        d3.selectAll(".tableHeaderRow")
          .append("table")
            .attr("class","table table-headers")
            .append("thead")
              .append("tr")
          .selectAll("th")
            .data(data.headers.columns)
            .enter().append("th")
              .attr("class",function(d){
                return d.class + " table-header"
              })
              .text(function(d){
                return d.name;
              })
              .attr("width",function(d,i){
                if(i===0){
                  return "20%"
                }else{
                  return (1/(data.headers.columns.length))*100 + "%"
                }
              })
              .append("table")
                .attr("class","table table-shrink")
                .append("tr")
              .selectAll("th")
                .data(function(d){
                  return d.subrows
                })
                .enter().append("th")
                  .text(function(d){
                    return d.name
                  })
                  .attr("width",function(d,i){
                    return (1/colWidth)*100+"%"
                  })

      tables.append("tbody")
        .selectAll("tr")
          .data(function(table){
            var rowTitles = _.uniqBy(data.data.filter(function(d){
                                return d.table===table
                              }),function(row){
                                return [row.row,row.subrow].join()
                              }),
                inputs    = _.uniqBy(data.data.filter(function(d){
                                return d.table===table
                              }),function(row){
                                return row.subrow
                              });

            return rowTitles.map(function(d){
              return {data:data.data.filter(function(row){
                return row.table===table && row.row===d.row && row.subrow===d.subrow
              }),type:"data"}
            }).concat(inputs.map(function(d){
              return {data:data.data.filter(function(row){
                return row.table===table && row.row===d.row && row.subrow===d.subrow
              }).map(function(col){
                var value = col.value
                if(col.subgroup==="Cycle"){
                  value = "Input"
                }else if(col.subgroup!="Category"){
                  value = ""
                }
                return {
                  tableType:table,
                  group:col.group,
                  subgroup:col.subgroup,
                  row:"Input",
                  subrow:d.subrow,
                  value:value
                }
              }),type:"input"}
            }));
          })
          .enter().append("tr")
            .attr("class",function(d){
              if(d.type==="input"){
                return "input"
              }
            })
          .selectAll("td")
            .data(function(d){
              return data.headers.columns.map(function(col){
                return d.data.filter(function(rows){
                  return rows.group === col.name
                })
              })
            })
            .enter().append("td")
              .attr("width",function(d,i){
                if(i===0){
                  return "20%"
                }else{
                  return (1/(data.headers.columns.length))*100 + "%"
                }
              })
              .append("table")
                .attr("class","table table-shrink")
                .append("tr")
              .selectAll("td")
                .data(function(d){
                  return d
                })
                .enter().append("td")
                  .attr("width",function(){
                    return (1/colWidth)*100+"%"
                  })
                  .attr("data-table",function(d){
                    return d.tableType
                  })
                  .attr("data-row",function(d){
                    return d.row
                  })
                  .attr("data-subrow",function(d){
                    return d.subrow
                  })
                  .attr("data-group",function(d){
                    return d.group
                  })
                  .attr("data-subgroup",function(d){
                    return d.subgroup
                  })

        d3.selectAll("tr:not(.input)").selectAll("table>tr>td")
          .text(function(d){
            if(d.group==="Data Type"){
              return d.value
            }else if(d.table==="Vote Total"||d.table==="Population"){
              return numberWithCommas(Math.round(d.value))
            }else if(d.table==="Turnout"||d.table==="Support"){
              return (d.value*100).toFixed(1) + "%"
            }else{
              return d.value
            }
          })

        d3.select(".contentDiv").selectAll(".input").selectAll("table>tr>td")
          .filter(function(d){
            return d.group!="Data Type"
          })
          .append("input")
            .attr("class",function(d){
              if(d.tableType==="Population"){
                return "form-control int"
              }else{
                return "form-control perc"
              }
            })
            .attr("data-table",function(d){
              return d.tableType
            })
            .attr("data-row",function(d){
              return d.row
            })
            .attr("data-subrow",function(d){
              return d.subrow
            })
            .attr("data-group",function(d){
              return d.group
            })
            .attr("data-subgroup",function(d){
              return d.subgroup
            })
            .attr("readonly",function(d){
              if(d.subrow==="Other"){
                return "readonly"
              }
            })

        $(".int").inputmask({
          "alias": "decimal",
          'groupSeparator':',',
          'autoGroup':true,
          'rightAlign':false,
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

        if(scenario){
            firebase.database().ref('/campaigns/'+campaign+'/scenarios/'+scenario).once("value",function(scenario){
                setValues(data.headers,scenario.val().data,function(){
                  state.scenario = scenario
                  setTimeout(function(){
                    writeTotals(data.headers,vizDetails);
                  },1000)
                });
            })
        }else{
            setValues(data.headers,data.scenarios[Object.keys(data.scenarios)[0]].data,function(){
              state.scenario = Object.keys(data.scenarios)[0]
              writeTotals(data.headers,vizDetails);
            });
        }

        d3.selectAll("input").on("change",function(e){
          writeTotals(data.headers,vizDetails);
        });

        d3.selectAll("input").filter(function(d){
          return d3.select(this).attr("data-table") === "Support"
        }).on("change",function(e){

          var totalDemoSupport = d3.selectAll("input").filter(function(d){
            return e.group===d3.select(this).attr("data-group") && e.subgroup===d3.select(this).attr("data-subgroup") && d3.select(this).attr("data-table")==="Support" && d3.select(this).attr("data-subrow")!="Other"
          }).nodes().reduce(function(a,d,i,array){
            return a+parseInt(d.inputmask.unmaskedvalue())
          },0)

          if(totalDemoSupport<=100){
            d3.selectAll("input").filter(function(d){
              return e.group===d3.select(this).attr("data-group") && e.subgroup===d3.select(this).attr("data-subgroup") && d3.select(this).attr("data-table")==="Support" && d3.select(this).attr("data-subrow")==="Other"
            }).property("value",(100-totalDemoSupport)/100).attr("class","form-control perc");
            writeTotals(data.headers,vizDetails);
          }else{
            d3.selectAll("input").filter(function(d){
              return e.group===d3.select(this).attr("data-group") && e.subgroup===d3.select(this).attr("data-subgroup") && d3.select(this).attr("data-table")==="Support" && d3.select(this).attr("data-subrow")==="Other"
            }).property("value","").attr("class","form-control perc input-warning");
            writeTotals(data.headers,vizDetails);
          }
        })
  },function(err){
    if(err){
      console.log(err)
    }
  });
};

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

var setValues = function(headers,values,cb){
  var inputTds = d3.select("#inputContent").selectAll("td").filter(function(d){
    return d.row === "Input"
  });

  async.map(headers.columns.filter(function(d){
    return d.name!="Data Type"
  }),function(group,headerCb){
    async.map(group.subrows,function(subgroup,subgroupCb){
      async.forEach(d3.selectAll("input[data-group='"+group.name+"'][data-subgroup='"+subgroup.name+"']").nodes(),function(input,inputCb){
        var subrow   = d3.select(input).attr("data-subrow"),
            row      = d3.select(input).attr("data-row"),
            table    = d3.select(input).attr("data-table"),
            inputVal = values.filter(function(value){
              return value.group===group.name && value.subgroup===subgroup.name && value.subrow===subrow && value.table===table
            });

        d3.select(input).attr("data-startValue",inputVal[0].value)
        d3.select(input).property("value",inputVal[0].value);

        inputCb()
      },function(){
        subgroupCb()
      })
    },function(){
      headerCb()
    })
  },function(){
    return cb()
  })
}

var reset = function(){
  d3.selectAll(".headerRow").selectAll("*").remove()
  d3.selectAll(".contentRow").selectAll("*").remove()
  d3.selectAll(".tableHeaderRow").selectAll("*").remove()
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
