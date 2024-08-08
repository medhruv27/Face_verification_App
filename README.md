Worker Uniform Detection using YOLO
For running the project steps
 1>ensure you are in new virtual environment you can create one by 
   conda create -n dvenv python=3.8
   conda activate dvenv
2>pip install deepface 
3>run   python extract_faces.py
Overview

This project utilizes YOLOv8, an advanced version of the YOLO (You Only Look Once) model, for detecting worker uniforms in images and videos. The goal is to accurately identify and localize specific types of uniforms worn by workers in various settings.

Features
YOLOv8 Implementation: Utilizes YOLOv8, an optimized and improved version of YOLO for object detection tasks.
Multi-Class Detection: Capable of detecting multiple types of worker uniforms simultaneously.
Customizable: Easily extendable to detect new types of uniforms by retraining on additional data.
Performance: Designed for real-time and efficient detection tasks.

