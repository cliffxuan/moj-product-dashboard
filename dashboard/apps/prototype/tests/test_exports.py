# -*- coding: utf-8 -*-
from datetime import date
from decimal import Decimal

from django.test import TestCase
from model_mommy import mommy


from ..models import Project, Client, Person, PersonCost, Rate, Task
from ..constants import COST_TYPES


EXPORT_URLS = [
    '/admin/prototype/project/export/adjustment/',
    '/admin/prototype/project/export/intercompany/',
    '/admin/prototype/project/export/projectdetail/',
]


class ExportTestCase(TestCase):
    fixtures = ['auth_group_permissions.yaml', 'test_users']

    def setUp(self):
        client = mommy.make(Client)
        self.project = mommy.make(Project, client=client)

        p = mommy.make(Person)
        c = mommy.make(Person, is_contractor=True)

        mommy.make(
            PersonCost,
            person=p,
            name='ASLC',
            start_date=date(2015, 1, 1),
            type=COST_TYPES.ANNUALLY,
            cost=Decimal('30000')
        )

        mommy.make(
            PersonCost,
            person=p,
            name='ASLC',
            start_date=date(2015, 1, 1),
            type=COST_TYPES.ANNUALLY,
            cost=Decimal('30000')
        )

        mommy.make(
            Rate,
            person=p,
            rate=1,
            start_date=date(2015, 1, 1)
        )

        mommy.make(
            Task,
            person=p,
            project=self.project,
            start_date=date(2015, 1, 1),
            end_date=date(2015, 1, 2),
            days=1
        )

        mommy.make(
            Rate,
            person=c,
            rate=1,
            start_date=date(2015, 1, 1)
        )

        mommy.make(
            Task,
            person=c,
            project=self.project,
            start_date=date(2015, 1, 1),
            end_date=date(2015, 1, 2),
            days=1
        )

    def test_can_export_files(self):
        self.client.login(username='test_finance', password='Admin123')
        for url in EXPORT_URLS:
            response = self.client.post(
                url,
                {'date': date(2015, 1, 1), 'project': self.project.pk})
            self.assertEqual(response.status_code, 200)