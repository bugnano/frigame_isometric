#! /usr/bin/env python
# -*- coding: ascii -*-

from __future__ import division

import sys
import os

import shutil
import subprocess


GitRepos = (
	'https://github.com/bugnano/frigame.git',
	'https://github.com/bugnano/frigame_sorted.git',
)


def main():
	root = os.getcwd()
	if not os.path.isdir('deps'):
		os.mkdir('deps')

	os.chdir('deps')
	for repo in GitRepos:
		subprocess.call(['git', 'clone', repo])


if __name__ == '__main__':
	main()

