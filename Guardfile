#! /usr/bin/env python

import os

from livereload.task import Task
from livereload.compiler import CommandCompiler


def coffee(path, output):
	def _compile():
		c = CommandCompiler(path)
		f = open(path)
		code = f.read()
		f.close()
		c.init_command('coffee --compile --stdio', code)
		c.write(output)

	return _compile


def sass(path, output):
	def _compile():
		c = CommandCompiler(path)
		c.init_command('sass')
		c.write(output)

	return _compile


for root, dirs, files in os.walk(os.getcwd()):
	Task.add(os.path.join(root, '*.html'))
	Task.add(os.path.join(root, '*.css'))
	Task.add(os.path.join(root, '*.js'))

	if '.hg' in dirs:
		dirs.remove('.hg')

	for name in files:
		full_name = os.path.join(root, name)

		if name.endswith('.coffee'):
			Task.add(full_name, coffee(full_name, '.'.join([full_name[:-7], 'js'])))

		if name.endswith('.scss'):
			Task.add(full_name, sass(full_name, '.'.join([full_name[:-5], 'css'])))

