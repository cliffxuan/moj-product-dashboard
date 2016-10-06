from datetime import datetime

from django.shortcuts import render, redirect
from django.http import JsonResponse, Http404, HttpResponse
from django.core.urlresolvers import reverse
from django.contrib.auth.decorators import login_required
from django.views.generic import View
from django.views.decorators.http import require_http_methods

from openpyxl.workbook import Workbook

from dashboard.libs.date_tools import parse_date
from .models import Product, Area, ProductGroup
from .tasks import sync_float


def _product_meta(request, product):
    meta = {
        'can_edit': product.can_user_change(request.user),
        'admin_url': request.build_absolute_uri(product.admin_url)
    }
    return meta


def product_html(request, id):
    if not id:
        id = Product.objects.visible().first().id
        return redirect(reverse(product_html, kwargs={'id': id}))
    try:
        Product.objects.visible().get(id=id)
    except (ValueError, Product.DoesNotExist):
        raise Http404
    return render(request, 'common.html')


def product_json(request):
    """
    send json for a product profile
    """
    request_data = request.GET
    try:
        product = Product.objects.visible().get(id=request_data['id'])
    except (ValueError, Product.DoesNotExist):
        error = 'cannot find product with id={}'.format(request_data['id'])
        return JsonResponse({'error': error}, status=404)

    start_date = request_data.get('startDate')
    if start_date:
        start_date = parse_date(start_date)
    end_date = request_data.get('endDate')
    if end_date:
        end_date = parse_date(end_date)
    # get the profile of the product for each month
    profile = product.profile(
        start_date=start_date,
        end_date=end_date,
        freq='MS')
    meta = _product_meta(request, product)
    return JsonResponse({**profile, 'meta': meta})


def product_group_html(request, id):
    if not id:
        id = ProductGroup.objects.first().id
        return redirect(reverse(product_group_html, kwargs={'id': id}))
    try:
        ProductGroup.objects.get(id=id)
    except (ValueError, ProductGroup.DoesNotExist):
        raise Http404
    return render(request, 'common.html')


def product_group_json(request):
    """
    send json for a product group profilet
    """
    # TODO handle errors
    request_data = request.GET
    try:
        product_group = ProductGroup.objects.get(id=request_data['id'])
    except (ValueError, ProductGroup.DoesNotExist):
        error = 'cannot find product group with id={}'.format(
            request_data['id'])
        return JsonResponse({'error': error}, status=404)

    # get the profile of the product group for each month
    profile = product_group.profile(freq='MS')
    meta = _product_meta(request, product_group)
    return JsonResponse({**profile, 'meta': meta})


def service_html(request, id):
    if not id:
        id = Area.objects.filter(visible=True).first().id
        return redirect(reverse(service_html, kwargs={'id': id}))
    try:
        Area.objects.filter(visible=True).get(id=id)
    except (ValueError, Area.DoesNotExist):
        raise Http404
    return render(request, 'common.html')


def service_json(request):
    request_data = request.GET
    try:
        area = Area.objects.filter(visible=True).get(id=request_data['id'])
    except (ValueError, Area.DoesNotExist):
        error = 'cannot find service area with id={}'.format(
            request_data['id'])
        return JsonResponse({'error': error}, status=404)
    # get the profile of the service
    return JsonResponse(area.profile())


def portfolio_html(request):
    return render(request, 'common.html', {'body_classes': 'portfolio'})


def portfolio_json(request):
    result = {area.id: area.profile() for area
              in Area.objects.filter(visible=True)}
    return JsonResponse(result)


@login_required
@require_http_methods(['POST'])
def sync_from_float(request):
    sync_float.delay()
    return JsonResponse({
        'status': 'STARTED'
    })


class PortfolioExportView(View):
    http_method_names = ['get']

    def get(self, request, *args, **kwargs):
        show_all = kwargs.get('show', 'visible') == 'all'
        print(kwargs, args, show_all)
        now = datetime.now()
        fname = '%s_%s_%s.xls' % (
            'ProductData',
            'all' if show_all else 'visible',
            now.strftime('%Y-%m-%d_%H:%M:%S'))

        fields = [
            'id',
            'name',
            'description',
            'area_name',
            'discovery_date',
            'alpha_date',
            'beta_date',
            'live_date',
            'end_date',
            'discovery_fte',
            'alpha_fte',
            'beta_fte',
            'live_fte',
            'final_budget',
            'cost_of_discovery',
            'cost_of_alpha',
            'cost_of_beta',
            'cost_in_14_15',
            'cost_in_15_16',
            'cost_in_16_17',
            'cost_in_17_18',
            'cost_of_sustaining',
            'total_recurring_costs',
            'savings_enabled',
            'visible',
        ]

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = 'Products info'
        sheet.append([f.replace('_', ' ').capitalize() for f in fields])

        products = Product.objects.all()
        if not show_all:
            products = products.filter(visible=True)

        for product in products:
            row = []
            for f in fields:
                val = getattr(product, f)
                if callable(val):
                    val = val()
                row.append(val)
            sheet.append(row)

        response = HttpResponse(
            content_type="application/vnd.ms-excel")
        response['Content-Disposition'] = 'attachment; filename=%s' \
                                          % fname
        workbook.save(response)
        return response
