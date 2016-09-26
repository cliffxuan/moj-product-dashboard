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
from django.conf.urls import url, include
from django.conf import settings
from django.contrib import admin
from moj_irat.views import PingJsonView, HealthcheckView

from dashboard.apps.dashboard.views import (
    service_html, service_json, product_html, product_json, product_group_json,
    product_group_html, portfolio_html, portfolio_json, sync_from_float)


urlpatterns = [
    url(r'^$', portfolio_html, name='portfolio_html'),
    url(r'^sync.json$', sync_from_float, name='sync'),
    url(r'^services/(?P<id>[0-9]+)?$', service_html, name='service'),
    url(r'^service.json', service_json, name='service_json'),
    url(r'^products/(?P<id>[0-9]+)?$', product_html, name='product'),
    url(r'^product-groups/(?P<id>[0-9]+)?$', product_group_html,
        name='product_group'),
    url(r'^product.json', product_json, name='product_json'),
    url(r'^product-group.json', product_group_json, name='product_group_json'),
    url(r'^portfolio.json', portfolio_json, name='portfolio_json'),
    url(r'^admin/', admin.site.urls),
    url('^', include('django.contrib.auth.urls')),
    url(r'^ping.json$', PingJsonView.as_view(**settings.PING_JSON_KEYS),
        name='ping_json'),
    url(r'^healthcheck.json$', HealthcheckView.as_view(),
        name='healthcheck_json'),
    url(r'^login/$', 'django.contrib.auth.views.login', {'template': 'login.html'}),
    url(r'^logout/$', 'django.contrib.auth.views.logout',
        {'next_page': '/'})
]
