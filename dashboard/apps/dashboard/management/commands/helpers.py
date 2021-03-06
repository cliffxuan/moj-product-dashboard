"""
some helper functions for creating commands
"""
import logging

from django.db.models import Q

from dashboard.apps.dashboard.models import Person, Product, Area


class NoMatchFound(Exception):
    pass


def print_person(person, padding=''):
    if person.is_contractor:
        line = '{}, {} (contractor)'.format(
            person.name, person.job_title,
            person.job_title)
    else:
        line = '{}, {} (civil servant)'.format(
            person.name, person.job_title,
            person.job_title)
    logging.info('%s%s', padding, line)


def print_task(task, start_date, end_date, padding='  '):
    lines = []
    lines.append('task name: {}'.format(task.name or 'N/A'))
    if task.product.is_billable:
        lines.append('product: {}, area: {}'.format(
            task.product, task.product.area.name))
    else:
        lines.append('product: {} (non-billable), area: {}'.format(
            task.product, task.product.area.name))
    lines.append('task start: {}, end: {}, total: {:.5f} working days'.format(
        task.start_date, task.end_date, task.days))
    time_spent = task.time_spent(start_date, end_date)
    people_costs = task.people_costs(start_date, end_date)
    lines.append(
        'spendings in this time frame: {:.5f} days, £{:.2f}'.format(
            time_spent, people_costs))
    for index, line in enumerate(lines):
        if index == 0:
            logging.info('%s- %s', padding, line)
        else:
            logging.info('%s  %s', padding, line)
    return time_spent, people_costs


def get_persons(names, as_filter=True):
    if not names:
        logging.info('people: all')
        if as_filter:
            return []
        else:
            return Person.objects.all()
    persons = Person.objects.filter(contains_any('name', names))
    if not persons:
        raise NoMatchFound(
            'could not find any person with name(s) {}'.format(
                ','.join(names)))
    logging.info('people: {}'.format(', '.join([p.name for p in persons])))
    return persons


def get_areas(names, as_filter=True):
    if not names:
        logging.info('areas: all')
        if as_filter:
            return []
        else:
            return Area.objects.all()
    areas = Area.objects.filter(contains_any('name', names))
    if not areas:
        raise NoMatchFound(
            'could not find any area with name(s) {}'.format(
                ','.join(names)))
    logging.info('areas: {}'.format(', '.join([p.name for p in areas])))
    return areas


def get_products(names, areas, as_filter=True):
    if not names and not areas:
        logging.info('products: all')
        if as_filter:
            return []
        else:
            return Product.objects.all()

    products = Product.objects.filter(contains_any('name', names))

    if areas:
        if not isinstance(areas[0], Area):
            areas = get_areas(areas)
        products = products.filter(area__in=areas)

    if not products:
        area_names = ','.join([area.name for area in areas]) or 'all'
        raise NoMatchFound(
            ('could not find any product with name(s) {} and area(s) {}'
             ).format(','.join(names), area_names))
    logging.info('products: {}'.format(', '.join([p.name for p in products])))
    return products


def contains_any(field, values, ignore_case=True):
    if ignore_case:
        key = '{}__icontains'.format(field)
    else:
        key = '{}__contains'.format(field)

    filter_by_values = Q()
    for value in values:
        filter_by_values |= Q(**{key: value})

    return filter_by_values
