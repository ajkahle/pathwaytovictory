var startup = function(user){
  firebase.database().ref('/campaigns/7iRR7rziYmgc').once("value",function(rawData){
    var data      = rawData.val(),
        tables    = d3.selectAll(".contentRow").append("table")
                      .datum(function(d){
                        return d3.select(this.parentNode).attr("data-category")
                      })
                      .attr("class","table"),
        colWidth  = 0;

      data.headers.columns.forEach(function(d){
        if(d.subrows.length>colWidth){
          colWidth = d.subrows.length
        }
      });

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
            .attr("width",function(){
              return (1/data.headers.columns.length)*100 + "%"
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
                .attr("width",function(d){
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
            .attr("width","25%")
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

      $(".int").inputmask({"alias": "decimal",'groupSeparator':',','autoGroup':true});

      setValues(data.headers,data.scenarios[Object.keys(data.scenarios)[0]].data);
      writeTotals(data.headers);

      d3.selectAll("input").on("change",function(e){
        writeTotals(data.headers);
      })

  });
};

var writeTotals = function(headers){
  var totalTds = d3.select("#totalContent").selectAll("td").filter(function(d){
    return d.row === "Input"
  })
  headers.columns.filter(function(d){
    return d.name!="Data Type"
  }).map(function(group){
     group.subrows.map(function(subrow){
      var inputs =  d3.selectAll("input[data-group='"+group.name+"'][data-subgroup='"+subrow.name+"']").nodes().map(function(input){
        return {
            val:parseFloat(input.value),
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
      })
      if(votingConstant>0){

        totalTds.filter(function(td){
          return td.subgroup===subrow.name && td.group===group.name && td.subrow==="Total"
        }).text(

        Math.round(
          inputs.filter(function(input){
              return input.table==="Support"
            }).reduce(function(a,d,i,array){
              var val = 0;
              if(!isNaN(d.val)){
                val = d.val
              }

              totalTds.filter(function(td){
                return td.subgroup===d.subgroup && td.group===d.group && td.subrow ===d.subrow
              }).text(Math.round(votingConstant*val))

              if(isNaN(a)){
                return (votingConstant*val)
              }else{
                return a+(votingConstant*val)
              }
            },0))
          )
      }

    })

  })
}

var setValues = function(headers,values){
  var inputTds = d3.select("#inputContent").selectAll("td").filter(function(d){
    return d.row === "Input"
  });

  headers.columns.filter(function(d){
    return d.name!="Data Type"
  }).map(function(group){
     group.subrows.map(function(subgroup){
      var inputs =  d3.selectAll("input[data-group='"+group.name+"'][data-subgroup='"+subgroup.name+"']").each(function(input){
        var subrow   = d3.select(this).attr("data-subrow"),
            row      = d3.select(this).attr("data-row"),
            table    = d3.select(this).attr("data-table"),
            inputVal = values.filter(function(value){
              return value.group===group.name && value.subgroup===subgroup.name && value.subrow===subrow && value.table===table
            });

        d3.select(this).property("value",inputVal[0].value);

      })
    })
  })
}
