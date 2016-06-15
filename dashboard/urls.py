"""dashboard URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.9/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.conf import settings
from django.contrib import admin
from moj_irat.views import PingJsonView, HealthcheckView

from dashboard.apps.prototype.views import (
    index, area_html, area_json, project_html, project_json)
from django.contrib.auth import views as auth_views


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^areas/(?P<id>[0-9]+)$', area_html, name='area'),
    url(r'^area.json', area_json, name='area_json'),
    url(r'^projects/(?P<id>[0-9]+)$', project_html, name='project'),
    url(r'^project.json', project_json, name='project_json'),
    url(r'^admin/', admin.site.urls),
    url(r'^login/', auth_views.login),
    url(r'^ping.json$', PingJsonView.as_view(**settings.PING_JSON_KEYS),
        name='ping_json'),
    url(r'^healthcheck.json$', HealthcheckView.as_view(),
        name='healthcheck_json'),
]
