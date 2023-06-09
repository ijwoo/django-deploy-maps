from django import forms

class LocationForm(forms.Form):
    start_address = forms.CharField(label='첫번째 주소')
    end_address = forms.CharField(label='두번째 주소')
    start_latitude = forms.FloatField(label='첫번째 위도', widget=forms.HiddenInput())
    start_longitude = forms.FloatField(label='첫번째 경도', widget=forms.HiddenInput())
    end_latitude = forms.FloatField(label='두번째 위도', widget=forms.HiddenInput())
    end_longitude = forms.FloatField(label='두번째 경도', widget=forms.HiddenInput())