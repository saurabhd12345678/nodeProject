#!/bin/bash
echo 'Entered The Batch file'
arg1=$1
arg2=$2
echo $arg1
echo $arg2
mydir="$(pwd)"
# git clone $arg1
newdir="$(pwd)/templates/generated/"
# cp -rvpf $mydir/app/templates/generated/*.* $mydir/repository/$arg2-repo/
cd $newdir
#cp -rvpf cwd/app/templates/generated/arg2/*.* cwd/arg2-repo/
git config --global user.name "Admin"
git config --global user.email "admin@lntinfotech.com"
git init
git add --all
git commit -m "Initial Commit"
git push -u $arg1 master
rm -r .git
