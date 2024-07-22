# -*- coding: utf-8 -*-
"""yolo.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1S-jxV9C8alV1Fy2ouPHruJ__K5fNBgC9
"""

# install yoloV8

!pip install ultralytics==8.0.196

from IPython import display
display.clear_output()

import ultralytics
ultralytics.checks()

from ultralytics import YOLO

from IPython.display import display, Image

import os
HOME = os.getcwd()
print(HOME)


#import daataset from roboflow universe //dataset link provided

!mkdir {HOME}/datasets
# %cd {HOME}/datasets

!pip install roboflow --quiet

from roboflow import Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("roboflow-jvuqo").project("football-players-detection-3zvbc")
dataset = project.version(1).download("yolov8")


#train model on custom dataset

# %cd {HOME}

!yolo task=detect mode=train model=yolov8s.pt data={dataset.location}/data.yaml epochs=25 imgsz=800 plots=True

!ls {HOME}/runs/detect/train/


# Validate custom model

# %cd {HOME}

!yolo task=detect mode=val model={HOME}/runs/detect/train/weights/best.pt data={dataset.location}/data.yaml


# Inference with custom model

# %cd {HOME}
!yolo task=detect mode=predict model={HOME}/runs/detect/train/weights/best.pt conf=0.25 source={dataset.location}/test/images save=True