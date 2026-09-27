# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-screens: when Android recreates the Activity (font size or
# language change, or a return after the process was killed in the
# background), RNScreensFragmentFactory recognises its own fragments by their
# package name and discards them. R8 would rename them, the factory would miss
# them, and the app crashed with "Screen fragments should never be restored"
# (found in the Phase 4 Android QA pass). Names only; unused code still shrinks.
-keepnames class com.swmansion.rnscreens.** extends androidx.fragment.app.Fragment
