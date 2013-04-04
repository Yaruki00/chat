window.onload = function () {
    if(document.getElementById('user')) {
        document.getElementById('user').onsubmit = function() {
            var check = true;
            if(document.getElementById('userid').value == '') {
                check = false;
                document.getElementById('userid_msg').innerHTML = '<font color="red">input ID</font>';
            } else { 
                document.getElementById('userid_msg').innerHTML = '';
            }
            if(document.getElementById('pass').value == '') {
                check = false;
                document.getElementById('pass_msg').innerHTML = '<font color="red">input pass</font>';
            } else {
                document.getElementById('pass_msg').innerHTML = '';
            }
            return check;
        }
    } else if(document.getElementById('createRoom')) {
        document.getElementById('createRoom').onsubmit = function() {
            var check = true;
            if(document.getElementById('name').value == '') {
                check = false;
                document.getElementById('createRoom_msg').innerHTML = '<font color="red">input new room name</font>';
            }
            return check;
        }
    }
}
