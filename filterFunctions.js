var maxGrade=100

//sortByGrade takes a list of edX schema tracking objects, lower grade, and an upper grade. It returns the objects belongign to a student with a grade above the lower grade and below the upper grade.
var sortByGrade = function(list,lower, upper){
    var filteredList=[]
    if (lower == ""){
        lower= 0
    }
    if (upper==""){
        upper=maxGrade
    }
    
    parseInt(lower)
    parseInt(upper)
    for (var i=0;i<list.length;i++){
        
        var grade = list[i]['grade']
        if ((lower<=grade)&&(grade<=upper)){
            filteredList.push(list[i])
        }
    }
    return filteredList
}

//sortByType is currently unused. It takes a list of edX schema tracking object and a list of edX schema event_types, and returns a list of objects with an event_type that is in types.
var sortByType=function(list, types){
    var newList=[]
    
    var videoTypes=['play_video','pause_video']
    var problemTypes=['problem_check']
    for (var i=0;i<types.length;i++){
        if (types[i]=='video'){
            for (var j=0;j<list.length;j++){
                if (videoTypes.indexOf(list[j]['event_type'])!=-1){
                    newList.push(list[j])
                }
            }
        }
        if (types[i]=='problem'){
            for (var k=0;k<list.length;k++){
                if (problemTypes.indexOf(list[k]['event_type'])!=-1){
                    newList.push(list[k])
                }
            }
        }
    }
    return newList
    
}

//weeklyCompile takes a list of edX schema tracking items, and compiles them to show trends over and 'average week'. It currently sets every Moday to the first Monday in September, every Tuesday to the first Tuesday, etc. This will be changed.
var weeklyCompile = function(list){
    var copyList = $.extend(true, [], list)
    for (var i=0;i<copyList.length;i++){
        var day = (new Date(copyList[i]['time'])).getDay()
        var time =copyList[i]['time'].split('T')[1]
        if (day==0){
            copyList[i]['time']= '2013-09-01T'+time 
        }
        if (day==1){
            copyList[i]['time']= '2013-09-02T'+time 
        }
        if (day==2){
            copyList[i]['time']= '2013-09-03T'+time 
        }
        if (day==3){
            copyList[i]['time']= '2013-09-04T'+time 
        }
        if (day==4){
            copyList[i]['time']= '2013-09-05T'+time 
        }
        if (day==5){
            copyList[i]['time']= '2013-09-06T'+time 
        }
        if (day==6){
            copyList[i]['time']= '2013-09-07T'+time 
        }
    }
    return copyList
    
}

//obj_date_sort is a function to be used to sort lists of objects containing 'time' in ascending date order. Use this as a parameter for  .sort()
var obj_date_sort=function (obj1, obj2){
    var date1= new Date(obj1['time'])
    var date2= new Date(obj2['time'])
    if (date1 > date2) return 1;
    if (date1 < date2) return -1;
    return 0;
}

//getTimeRange takes a list of edX schema tracking objects, a start date object, and a end date object. It returns a list of all objects falling after the start date and before the end date.
var getTimeRange=function(list,start,end){
    var newList=[]
    var startMS=start.valueOf()
    var endMS=end.valueOf()
    for (var i=0;i<list.length;i++){
        var currentDate = new Date(list[i]['time'])
        var currentMS= currentDate.valueOf()
        if ((currentMS>startMS)&&(currentMS<endMS)){
            newList.push(list[i])
        }
    }
    return newList
}