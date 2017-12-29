#! /usr/bin/env python
# -*- coding: ascii -*-

from __future__ import division

import sys
import os

import shutil
import subprocess


HgRepos = (
	'https://bitbucket.org/bugnano/frigame',
	'https://bitbucket.org/bugnano/frigame_sorted',
)


def main():
	root = os.getcwd()
	if not os.path.isdir('deps'):
		os.mkdir('deps')

	os.chdir('deps')
	for repo in HgRepos:
		subprocess.call(['hg', 'clone', repo])


if __name__ == '__main__':
	main()

