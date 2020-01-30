function showLoginScreen(){
    $("#loading").hide();
    $("#loginScreen").fadeIn(600);
}


function fillGameRoomDropDown(data){    
    var select = $("#gameRooms");

    for (var prop in data) {
        var option = document.createElement('option');
        option.innerHTML = data[prop].name
        option.value = data[prop].name;
        select.append(option)
    }

    $("#joinGameRoom").show();
}