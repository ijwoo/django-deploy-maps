var LABELS = ['1', '2', '3', '4', '5'];
var pendingAddress = null;

function updateInputLabels() {
    var rows = document.querySelectorAll('.input-row');
    rows.forEach(function(row, i) {
        var label = row.querySelector('.input-label');
        if (label) label.textContent = LABELS[i] || (i + 1);
    });
}

// 삭제 버튼 활성/비활성 (최소 2개 유지)
function updateRemoveButtons() {
    var rows = document.querySelectorAll('.input-row');
    var count = rows.length;
    rows.forEach(function(row) {
        var btn = row.querySelector('.remove-button');
        if (btn) btn.disabled = count <= 2;
    });
}

// 추가 버튼 활성/비활성 (최대 5개)
function updateAddButton() {
    var btn = document.querySelector('.btn-add');
    if (!btn) return;
    var count = document.querySelectorAll('.coordinate-input').length;
    btn.disabled = count >= 5;
    btn.textContent = count >= 5 ? '최대 5개' : '+ 추가';
}

// 출발지 추가 확인 UI 표시
function showAddConfirm(address) {
    dismissAddConfirm();

    if (document.querySelectorAll('.coordinate-input').length >= 5) {
        showToast('최대 5개까지 입력할 수 있습니다');
        return;
    }

    pendingAddress = address;

    var wrap = document.createElement('div');
    wrap.id = 'add-confirm';
    wrap.className = 'add-confirm';

    var textEl = document.createElement('div');
    textEl.className = 'add-confirm-text';
    textEl.textContent = '출발지를 추가할까요?';

    var addrEl = document.createElement('div');
    addrEl.className = 'add-confirm-addr';
    addrEl.textContent = address.length > 28 ? address.substring(0, 27) + '…' : address;

    var actionsEl = document.createElement('div');
    actionsEl.className = 'add-confirm-actions';

    var yesBtn = document.createElement('button');
    yesBtn.className = 'add-confirm-yes';
    yesBtn.textContent = '+ 출발지 추가';
    yesBtn.addEventListener('click', function () {
        var addr = pendingAddress;
        dismissAddConfirm();
        addAddressInput();
        var inputs = document.querySelectorAll('.coordinate-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].value = addr;
        }
        // 패널이 닫혀있으면 열기
        var panel = document.getElementById('panel');
        if (panel && panel.classList.contains('panel--hidden')) {
            togglePanel();
        }
        showToast('출발지가 추가되었습니다');
    });

    var noBtn = document.createElement('button');
    noBtn.className = 'add-confirm-no';
    noBtn.textContent = '취소';
    noBtn.addEventListener('click', function () {
        dismissAddConfirm();
    });

    actionsEl.appendChild(yesBtn);
    actionsEl.appendChild(noBtn);
    wrap.appendChild(textEl);
    wrap.appendChild(addrEl);
    wrap.appendChild(actionsEl);

    // 입력 컨테이너 위에 삽입
    var panel = document.getElementById('panel');
    var inputContainer = document.getElementById('input-container');
    if (panel && inputContainer) {
        panel.insertBefore(wrap, inputContainer);
        // 패널이 닫혀있으면 열기
        if (panel.classList.contains('panel--hidden')) {
            togglePanel();
        }
    }
}

function dismissAddConfirm() {
    pendingAddress = null;
    var existing = document.getElementById('add-confirm');
    if (existing) existing.remove();
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

    updateRemoveButtons();
    updateAddButton();
}

function removeAddressInput(button) {
    var row = button.parentNode;
    var addressCount = document.querySelectorAll('.coordinate-input').length;
    if (addressCount > 2) {
        row.parentNode.removeChild(row);
        updateInputLabels();
        updateRemoveButtons();
        updateAddButton();
    }
}

function addCurrentLocation() {
    if (!navigator.geolocation) {
        showToast('이 브라우저는 위치 서비스를 지원하지 않습니다');
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
            } else {
                showToast('현재 위치의 주소를 가져올 수 없습니다');
            }
        });
    }, function() {
        btn.disabled = false;
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg> 내 위치';
        showToast('위치 권한을 허용해주세요');
    });
}

function fillNextInput(address) {
    var inputs = document.querySelectorAll('.coordinate-input');
    // 빈 칸이 있으면 첫 번째 빈 칸에 채움
    for (var i = 0; i < inputs.length; i++) {
        if (!inputs[i].value.trim()) {
            inputs[i].value = address;
            showToast('출발지로 지정되었습니다');
            return;
        }
    }
    // 모든 칸이 채워진 경우 → 추가 여부 확인
    showAddConfirm(address);
}

// 페이지 로드 시 초기 버튼 상태 설정
updateRemoveButtons();
updateAddButton();
