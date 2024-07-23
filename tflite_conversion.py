import os

HOME = os.getcwd()

from ultralytics import YOLO

model = YOLO('best.pt') #path to pytorch model made using yolo

model.export(format='tflite') #tflite model gets saved as best_float32.tflite
