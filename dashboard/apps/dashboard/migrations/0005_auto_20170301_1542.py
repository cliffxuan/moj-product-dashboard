# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2017-03-01 15:42
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0004_department'),
    ]

    operations = [
        migrations.CreateModel(
            name='Skill',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=64, unique=True)),
            ],
        ),
        migrations.AddField(
            model_name='person',
            name='skills',
            field=models.ManyToManyField(related_name='person_skills', to='dashboard.Skill'),
        ),
    ]