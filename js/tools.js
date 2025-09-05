
let cContinent = 'Continent';
let cLand = 'Land';
let cKingdomId = 'Kingdom Id';
let cName = 'Castle Name';
let cDevPoints = 'Dev Points';
let cTotal = 'Total';

let filtersTitle = 'Filters Active : %d';
let showMessage = 'Show All';
let loadMessage = 'Loading Search Panes...';
let emptyPanes = 'No SearchPanes';
let emptyMessage = '<em>No data</em>';
let collapseMessage = 'Collapse All';
let clearMessage = 'Clear All';


getFormattedCurrentDate = function () {
    const date = new Date();
    const year = date.getFullYear();
    const month = parseInt(date.getMonth() + 1) >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1);
    const day = parseInt(date.getDate()) >= 10 ? date.getDate() : '0' + date.getDate();
    const finalDate = year + "-" + month + "-" + day;
    return finalDate;
};
getCurrentDate = function () {
    var date = new Date();
    date.setDate(date.getDate());
    return date;
};

addTitlesForLands = function (divId) {
    document.getElementById(divId).insertAdjacentHTML('beforeend', '\
                                                        <thead><tr>\n\
                                                        <th class="thContinent" style="width:auto;"></th>\n\
                                                        <th class="thLand" style="width:auto;"></th>\n\
                                                        <th class="thKingdomId" style="width:auto;"></th>\n\
                                                        <th class="thName" style="width:auto;"></th>\n\
                                                        <th class="thDevPoints" style="width:auto;"></th>\n\
                                                        <th class="thTotal" style="width:auto;"></th>\n\
                                                        </tr></thead>\n\
                                                        <tbody></tbody>');
};
getWeeksFromDate = function (fromDate, toDate, maxDays) {
    let comparison = compareDates(fromDate, toDate);
    let fcompare = convertMiliseconds(comparison, 'd');
    if (fcompare >= 0 && fcompare <= maxDays) {
        let periods = [];
        var diff = moment.duration(moment(toDate).diff(moment(fromDate)));
        let weeks = Math.floor(diff.asWeeks());
        let days = diff.asDays();
        let daysLeftWithoutWeeks = days % 7;
        let startDate = fromDate;
        let endDate;
        if (fcompare === 0) {
            periods.push(fromDate + " " + toDate);
        } else {
            for (var i = 0; i < weeks; i++) {
                endDate = moment(startDate).add('6', 'd');
                periods.push(startDate + " " + endDate.clone().format('YYYY-MM-DD'));
                startDate = moment(startDate).add('1', 'w').clone().format('YYYY-MM-DD');
            }
            if (daysLeftWithoutWeeks > 0) {
                endDate = moment(startDate).add(daysLeftWithoutWeeks, 'd');
                periods.push(startDate + " " + endDate.clone().format('YYYY-MM-DD'));
            }
        }
        return periods.length > 0 ? periods : null;
    }
    return null;
};

setDates = function (fromDate, toDate) {
    let datefrom = document.getElementById(fromDate);
    let dateto = document.getElementById(toDate);
    let currentDate = getFormattedCurrentDate();
    datefrom.value = currentDate;
    dateto.value = currentDate;
};

getSumOfDevPoints = function (datatableObjects, kingdomId) {
    try {
        for (var i = 0; i < datatableObjects.length; i++) {
            if (datatableObjects[i].kingdomId === kingdomId) {
                return datatableObjects[i].devPoints;
            }
        }
    } catch (error) {
        console.log(error);
    }
    return 0;
};
addSum = function (datatableObjects) {
    result = Object.values(datatableObjects.reduce(function (r, {kingdomId, devPoints}) {
        kingdomId = kingdomId || '';
        if (r[kingdomId] && !isEmpty(kingdomId)) {
            r[kingdomId].devPoints += devPoints;
        } else if (isEmpty(kingdomId)) {
            r[devPoints] = 0;
        } else {
            r[kingdomId] = {kingdomId, devPoints};
        }
        return r;
    }, Object.create(null)));
    try {
        for (var i = 0; i < datatableObjects.length; i++) {
            let obj = datatableObjects[i];
            let kingdomId = obj.kingdomId;
            let sum = getSumOfDevPoints(result, kingdomId);
            obj.sum = sum;
        }
    } catch (error) {
        console.log(error);
    }
    return datatableObjects;
};

drawLands = function (fromDate, toDate, lands) {
    let element = document.getElementById("lokaDatatable");
    if (element.hasChildNodes()) {
        redrawLandsDatatable(fromDate, toDate, lands);
    } else {
        drawLandsDatatable(fromDate, toDate, lands);
    }
};


drawLandsDatatable = function (fromDate, toDate, lands) {
    let row = 0, count = 0;
    let currentDate = getFormattedCurrentDate();
    let length = lands.length;
    let landResults = [];
    let datatableList = [];
    let datatableObjects = new Array();
    let totalDevPoints = parseFloat(0);
    for (var i = 0; i < length; i++) {
        let land = lands[i];
        fetch("https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?from=" + fromDate + "&to=" + toDate + "&landId=" + land).
                then((responce) => responce.json()).then((result) => {
            if (result.result === false) {
                emptyLandsInput();
                removeValFromLocal("lands", land);
                ;
                popupMessage('The land ' + land + ' not exists. Please edit the lands and be sure that they are valid lands.', 5);
                throw new Error('The land ' + land + ' not exists. Please edit the lands and be sure that they are valid lands.');
            } else {
                let owner = result.owner;
                let contribution = result.contribution;
                for (var k = 0; k < contribution.length; k++) {
                    let continent = contribution[k].continent;
                    let kingdomId = contribution[k].kingdomId;
                    let name = contribution[k].name;
                    let total = contribution[k].total;
                    let sum = 0;
                    let obj = {land: land, continent: continent, kingdomId: kingdomId, name: name, devPoints: total, sum: sum};
                    datatableObjects.push(obj);
                }
                if (count === length - 1) {

                    let datatableObjectsWithSum = addSum(datatableObjects);
                    let objLength = datatableObjectsWithSum.length;

                    for (var x = 0; x < objLength; x++) {
                        let record = datatableObjectsWithSum[x];
                        if (!isEmpty(record.kingdomId)) {
                            totalDevPoints += parseFloat(record.devPoints);
                        }
                        datatableList[row] = ['<div class="continent">' + record.continent + '</div>',
                            '<div class="land">' + record.land + '</div>',
                            '<div class="kingdomId">' + record.kingdomId + '</div>',
                            '<div class="castleName">' + record.name + '</div>',
                            '<div class="total">' + record.devPoints + '</div>',
                            '<div class="sum">' + record.sum + '</div>'];
                        row++;
                    }
                    addTitlesForLands('lokaDatatable');
                    $.fn.DataTable.ext.pager.numbers_length = 5;
                    let lokaTable = $('#lokaDatatable').DataTable({
                        "data": datatableList,
                        responsive: true,
                        serverSide: false,
                        aaSorting: [[3, 'desc']],
                        pageLength: 50,
                        "language": {
                            search: "",
                            searchPlaceholder: "Search"
                        },
                        "columnDefs": [
                            {className: 'dt-body-center', "targets": [0, 1, 2, 3, 4, 5]},
                            {searchPanes: {header: cContinent, show: true}, targets: [0]},
                            {searchPanes: {header: cLand, show: true}, targets: [1]},
                            {searchPanes: {header: cKingdomId, show: true}, targets: [2]},
                            {searchPanes: {header: cName, show: true}, targets: [3]},
                            {searchPanes: {show: false}, targets: [4]},
                            {searchPanes: {show: false}, targets: [5]}
                        ],
                        columns: [
                            {title: cContinent},
                            {title: cLand},
                            {title: cKingdomId},
                            {title: cName},
                            {title: cDevPoints},
                            {title: cTotal}
                        ],
                        buttons: [
                            {
                                extend: 'excelHtml5',
                                title: 'Excel',
                                text: 'Get Excel',
                                //Columns to export
                                exportOptions: {
                                    columns: [0, 1, 2, 3, 4, 5]
                                }
                            }
                        ],
                        searchPanes: {
                            viewTotal: true,
                            controls: false,
                            i18n: {
                                title: filtersTitle,
                                showMessage: showMessage,
                                loadMessage: loadMessage,
                                emptyPanes: emptyPanes,
                                emptyMessage: emptyMessage,
                                collapseMessage: collapseMessage,
                                clearMessage: clearMessage,
                                count: '{total}',
                                countFiltered: '{shown} ({total})'
                            }
                        },
                        dom: '<"colSearchPanes"<"searchPanes"P><"topBar"Blfp>>',
                        "pagingType": "simple_numbers",
                        "bAutoWidth": true,
                        "bAutoHeight": true,
                        "bProcessing": true
                    });
//                    document.getElementsByClassName('topBar')[0].insertAdjacentHTML('beforeend',
//                            '<div id="datProf">\n\
//                                    <div id="dateId">\n\
//                                    <input id="datefrom" type="date" value="' + currentDate + '"/>\n\
//                                    <input type="button" id="goButton" value="➤"/>\n\
//                                    <input id="dateto" type="date" value="' + currentDate + '"/>\n\
//                                    <input type="button" id="dateButton" value="GO"/>\n\
//                                    </div>\n\
//                                    </div>\n\
//                                    </div>');
                }
                count++;
            }
        });
    }
};

redrawLandsDatatable = function (fromDate, toDate, lands) {
    let periods = getWeeksFromDate(fromDate, toDate, 31);
    if (periods !== null) {
        let lokaDatatable = $('#lokaDatatable').DataTable();
        let periodsLength = periods.length;
        let landsLength = lands.length;
        let fetchArray = [], arrayLength;
        let datatableList = [];
        let datatableObjects = new Array();
        let row = 0, count = 0;
        let cleared = false;
        let totalDevPoints = parseFloat(0);
        for (var i = 0; i < periodsLength; i++) {
            let datesArray = periods[i].split(" ").filter(Boolean);
            let startDate = datesArray[0], endDate = datesArray[1];
            for (var k = 0; k < landsLength; k++) {
                const obj = {
                    land: lands[k],
                    url: "https://api-lok-live.leagueofkingdoms.com/api/stat/land/contribution?from=" + startDate + "&to=" + endDate + "&landId=" + lands[k]
                };
                fetchArray.push(obj);
            }
        }
        arrayLength = fetchArray.length;
        for (var j = 0; j < arrayLength; j++) {
            let land = fetchArray[j].land;
            let url = fetchArray[j].url;
            fetch(url).then((responce) => responce.json()).then((result) => {
                if (result.result === false) {
                    emptyLandsInput();
                    removeValFromLocal("lands", land);
                    popupMessage('The land ' + land + ' not exists. Please edit the lands and be sure that they are valid lands.', 5);
                    throw new Error('The land ' + land + ' not exists. Please edit the lands and be sure that they are valid lands.');
                } else {
                    let owner = result.owner;
                    let contribution = result.contribution;
                    for (var k = 0; k < contribution.length; k++) {
                        let continent = contribution[k].continent;
                        let kingdomId = contribution[k].kingdomId;
                        let name = contribution[k].name;
                        let total = contribution[k].total;
                        let sum = 0;
                        let obj = {land: land, continent: continent, kingdomId: kingdomId, name: name, devPoints: total, sum: sum};
                        datatableObjects.push(obj);
                    }
                }
                if (count === arrayLength - 1) {
                    let datatableObjectsWithSum = addSum(datatableObjects);
                    let objLength = datatableObjectsWithSum.length;
                    for (var x = 0; x < objLength; x++) {
                        let record = datatableObjectsWithSum[x];
                        if (!isEmpty(record.kingdomId)) {
                            totalDevPoints += parseFloat(record.devPoints);
                        }
                    }
                    for (var z = 0; z < objLength; z++) {
                        let record = datatableObjectsWithSum[z];
                        datatableList[row] = ['<div class="continent">' + record.continent + '</div>',
                            '<div class="land">' + record.land + '</div>',
                            '<div class="kingdomId">' + record.kingdomId + '</div>',
                            '<div class="castleName">' + record.name + '</div>',
                            '<div class="total">' + parseFloat(record.devPoints).toFixed(3) + '</div>',
                            '<div class="sum">' + parseFloat(record.sum).toFixed(3) + '</div>'];
                        row++;
                    }
                    if (datatableList.length > 0) {
                        if (!cleared) {
                            lokaDatatable.clear().draw();
                            cleared = true;
                        }
                        if (cleared) {
                            lokaDatatable.rows.add(datatableList);
                            lokaDatatable.columns.adjust().draw();
                            lokaDatatable.order([3, 'desc']).responsive(true);
                            lokaDatatable.searchPanes.rebuildPane();
                        }
                    }
                }
                count++;
            }).catch(error => {
                console.log(error);
            });
        }
    }
};
isEmpty = function (data) {
    if (data === null || typeof data === 'undefined') {
        return true;
    } else {
        if (isString(data)) {
            return data.toString().length === 0 || data.toString().toLowerCase() === 'null' ? true : false;
        } else if (Array.isArray(data)) {
            return data.length === 0;
        } else if (isObject(data)) {
            return Object.entries(data).length === 0;
        }
    }
    return false;
};
isString = function (val) {
    try {
        return typeof val === 'string' || val instanceof String ? true : false;
    } catch (Exception) {
        return false;
    }
    return false;
};

isObject = function (val) {
    return val instanceof Object && val.constructor === Object;
};

isEmpty = function (data) {
    if (data === null || typeof data === 'undefined') {
        return true;
    } else {
        if (isString(data)) {
            return data.toString().length === 0 || data.toString().toLowerCase() === 'null' ? true : false;
        } else if (Array.isArray(data)) {
            return data.length === 0;
        } else if (isObject(data)) {
            return Object.entries(data).length === 0;
        }
    }
    return false;
};
compareDates = function (fromDate, toDate) {
    let from = new Date(fromDate);
    let to = new Date(toDate);
    if (isValidDate(from) && isValidDate(to)) {
        let diff = to.getTime() - from.getTime();
        return diff >= 0 ? diff : null;
    }
    return null;
};
isValidDate = function (d) {
    return d instanceof Date && !isNaN(d);
};

convertMiliseconds = function (miliseconds, format) {
    var days, hours, minutes, seconds, total_hours, total_minutes, total_seconds;
    total_seconds = parseInt(Math.floor(miliseconds / 1000));
    total_minutes = parseInt(Math.floor(total_seconds / 60));
    total_hours = parseInt(Math.floor(total_minutes / 60));
    days = parseInt(Math.floor(total_hours / 24));
    seconds = parseInt(total_seconds % 60);
    minutes = parseInt(total_minutes % 60);
    hours = parseInt(total_hours % 24);
    switch (format) {
        case 's':
            return total_seconds;
        case 'm':
            return total_minutes;
        case 'h':
            return total_hours;
        case 'd':
            return days;
        default:
            return {d: days, h: hours, m: minutes, s: seconds};
    }
};
popupMessage = function (message, seconds) {

    let content = '<div class="w-full flex flex-col items-center space-y-4 sm:items-end">\n\
                        <div class=" w-full bg-white shadow-lg rounded-lg border border-gray-500 pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">\n\
                            <div class="p-4">\n\
                            <div class="ml-4 flex-shrink-0 flex flex-row-reverse">\n\
                                <button id="closeMessagePopUp" class="bg-white rounded-md inline-flex text-gray-400 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">\n\
                                    <span class="sr-only">Close</span>\n\
                                    <!-- Heroicon name: solid/x -->\n\
                                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">\n\
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />\n\
                                    </svg>\n\
                                </button>\n\
                                </div>\n\
                            <div class="flex items-start px-4">\n\
                                <div class=" flex-1 flex justify-between"> \n\
                                <p class=" flex-1 text-sm font-medium text-black">' + message + '</p>\n\
                                </div>\n\
                            </div>\n\
                            </div>\n\
                        </div>\n\
                    </div>';



    $('#popupMessage').empty();
    let popup = document.getElementById('popupMessage');
    popup.insertAdjacentHTML('beforeend', content);
    $('#popupMessage').fadeIn(1000).delay(seconds * 1000).fadeOut(500);
    $(document).on('click', '#closeMessagePopUp', function (e) {
        e.preventDefault();
        document.getElementById('popupMessage').style.display = "none";
        //$('#popupMessage').hide();
//            $('#popupMessage').fadeOut(100);
    });
};

sortByKey = function (array, key) {
    return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
};

isObject = function (val) {
    return val instanceof Object && val.constructor === Object;
};

isString = function (val) {
    try {
        return typeof val === 'string' || val instanceof String ? true : false;
    } catch (Exception) {
        return false;
    }
    return false;
}
;

isEmpty = function (data) {
    if (data === null || typeof data === 'undefined') {
        return true;
    } else {
        if (isString(data)) {
            return data.toString().length === 0 || data.toString().toLowerCase() === 'null' ? true : false;
        } else if (Array.isArray(data)) {
            return data.length === 0;
        } else if (isObject(data)) {
            return Object.entries(data).length === 0;
        }
    }
    return false;
}
;
isNumeric = function (value) {
    return /^-?\d+$/.test(value);
};
isValidLandsList = function (lands) {
    if (!isEmpty(lands)) {
        let length = lands.length;
        for (i = 0; i < length; i++) {
            if (!isNumeric(lands[i])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
;
isValidNumber = function (number) {
    if (isNumeric(number)) {
        return true;
    }
    return false;
};

removeDuplicates = function (arr) {
    return [...new Set(arr)];
};

getLandsToString = function (lands) {
    if (!isEmpty(lands)) {
        let uniqueLands = removeDuplicates(lands);
        let length = uniqueLands.length;
        let str = "";
        for (var i = 0; i < length; i++) {
            if (i < length - 1) {
                str += uniqueLands[i] + " ";
            } else {
                str += uniqueLands[i];
            }
        }
        return str;
    }
    return null;
}
;

setLandsToInputFromLocal = function (inputId) {
    let lands = getLocal("lands");
    if (!isEmpty(lands)) {
        document.getElementById(inputId).value = lands;
        return true;
    }
    return false;
}
;

getLandsFromInput = function (inputId) {
    let val = document.getElementById(inputId).value;
    if (!isEmpty(val)) {
        let lands = val.split(" ").filter(Boolean);
        let length = lands.length;
        let arr = new Array();
        for (i = 0; i < length; i++) {
            if (isValidNumber(lands[i]))
                arr.push(lands[i]);
        }
        return arr;
    }
    return null;
};

emptyLandsInput = function () {
    document.getElementById("inputLands").value = "";
};

includeNonCaseSensitive = function (arr, val) {
    return arr.map(e => e.toLowerCase()).includes(val.toLowerCase());
};

removeAllItemsFromArray = function (arr, value) {
    var i = 0;
    while (i < arr.length) {
        if (arr[i] === value) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
    return arr;
};

/*========================LOCAL STORAGE=========================*/

createLocal = function (name, value) {
    localStorage.setItem(name, value);
}
;
createLocalFromArray = function (name, arr) {
    let length = arr.length;
    let strng = "";
    for (var i = 0; i < length; i++) {
        if (i < length - 1) {
            strng += arr[i] + " ";
        } else {
            strng += arr[i];
        }
    }
    removeLocal(name);
    if (strng.length > 0) {
        createLocal(name, strng);
    }
};

getLocal = function (name) {
    let val = localStorage.getItem(name);
    if (!isEmpty(val)) {
        return val;
    }
    return null;
}
;

removeLocal = function (name) {
    localStorage.removeItem(name);
}
;

removeValFromLocal = function (name, val) {
    let contents = getLocal("lands").split(" ").filter(Boolean);
    if (includeNonCaseSensitive(contents, val)) {
        let vals = removeAllItemsFromArray(contents, val);
        createLocalFromArray(name, vals);
    }
}
;

clearLocal = function () {
    localStorage.clear();
}
;