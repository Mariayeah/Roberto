from setuptools import find_packages, setup
import os
from glob import glob

package_name = 'roberto_maps'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    
data_files=[
    ('share/ament_index/resource_index/packages',
        ['resource/' + package_name]),
    ('share/' + package_name, ['package.xml']),
    (os.path.join('share', package_name, 'maps'), glob('maps/*')),
],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='mery',
    maintainer_email='meryemboumlik612@gmail.com',
    description='TODO: Package description',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
        ],
    },
)
