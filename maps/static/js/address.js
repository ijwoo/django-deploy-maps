var LABELS = ['1', '2', '3', '4', '5'];

function updateInputLabels() {
    var rows = document.querySelectorAll('.input-row');
    rows.forEach(function(row, i) {
        var label = row.querySelector('.input-label');
        if (label) label.textContent = LABELS[i] || (i + 1);
    });
}

function addAddressInput() {
    var addressCount = document.querySelectorAll('.coordinate-input').length;
    if (addressCount >= 5) return;

    var container = document.getElementById('input-container');
    var row = document.createElement('div');
    row.classList.add('input-row');

    var labelEl = document.createElement('span');
    labelEl.classList.add('input-label');
    labelEl.textContent = LABELS[addressCount] || (addressCount + 1);

    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'coordinate-input';
    input.classList.add('coordinate-input');
    input.placeholder = '주소 입력 또는 지도 클릭';

    var removeBtn = document.createElement('button');
    removeBtn.classList.add('remove-button');
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('onclick', 'removeAddressInput(this)');

    row.appendChild(labelEl);
    row.appendChild(input);
    row.appendChild(removeBtn);
    container.appendChild(row);
}

function removeAddressInput(button) {
    var row = button.parentNode;
    var addressCount = document.querySelectorAll('.coordinate-input').length;
    if (addressCount > 2) {
        row.parentNode.removeChild(row);
        updateInputLabels();
    }
}

function addCurrentLocation() {
    if (!navigator.geolocation) {
        alert('이 브라우저에서는 위치 서비스를 지원하지 않습니다.');
        return;
    }

    var btn = document.getElementById('my-location-btn');
    btn.disabled = true;
    btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 확인 중...';

    navigator.geolocation.getCurrentPosition(function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;

        var geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2Address(lng, lat, function(result, status) {
            btn.disabled = false;
            btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 내 위치';

            if (status === kakao.maps.services.Status.OK) {
                var address = result[0].road_address
                    ? result[0].road_address.address_name
                    : result[0].address.address_name;
                fillNextInput(address);
                map.setCenter(new kakao.maps.LatLng(lat, lng));
                map.setLevel(4);
                showToast('내 위치가 입력되었습니다');
            } else {
                alert('현재 위치의 주소를 가져올 수 없습니다.');
            }
        });
    }, function() {
        btn.disabled = false;
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 내 위치';
        alert('위치 권한을 허용해주세요.');
    });
}

function fillNextInput(address) {
    var inputs = document.querySelectorAll('.coordinate-input');
    for (var i = 0; i < inputs.length; i++) {
        if (!inputs[i].value.trim()) {
            inputs[i].value = address;
            return;
        }
    }
    // 빈 칸 없으면 마지막에 채움
    if (inputs.length > 0) {
        inputs[inputs.length - 1].value = address;
    }
}
